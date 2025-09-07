/**
 * Subscription Guard Middleware
 * Enforces subscription limits and feature access throughout the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkUsageLimit, getUserSubscription, getUserUsage, canAccessFeature } from '@/lib/subscription/service';
import { type SubscriptionTier } from '@/lib/subscription/config';

export interface SubscriptionGuardOptions {
  action: 'generate_note' | 'use_storage';
  requiredFeature?: string;
  requiredTier?: SubscriptionTier;
  amount?: number;
}

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  subscription?: any;
  usage?: any;
  limits?: any;
}

/**
 * Main subscription guard function
 * Use this to check permissions before allowing actions
 */
export async function subscriptionGuard(
  userId: string,
  options: SubscriptionGuardOptions
): Promise<GuardResult> {
  try {
    // Get user's subscription and usage
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return {
        allowed: false,
        reason: 'No subscription found. Please sign up to continue.',
      };
    }

    const usage = await getUserUsage(userId);
    if (!usage) {
      return {
        allowed: false,
        reason: 'Unable to load usage data. Please try again.',
      };
    }

    // Check if user has required tier
    if (options.requiredTier) {
      const tierOrder = { free: 0, basic: 1, pro: 2 };
      const userTierLevel = tierOrder[subscription.tier];
      const requiredTierLevel = tierOrder[options.requiredTier];
      
      if (userTierLevel < requiredTierLevel) {
        return {
          allowed: false,
          reason: `This feature requires ${options.requiredTier} subscription or higher.`,
          subscription,
          usage,
        };
      }
    }

    // Check specific feature access
    if (options.requiredFeature && !canAccessFeature(subscription, options.requiredFeature)) {
      return {
        allowed: false,
        reason: `This feature is not available in your current subscription tier.`,
        subscription,
        usage,
      };
    }

    // Check usage limits
    const limitCheck = await checkUsageLimit(userId, options.action, options.amount);
    
    return {
      allowed: limitCheck.allowed,
      reason: limitCheck.reason,
      subscription,
      usage,
      limits: {
        limit: limitCheck.limit,
        current: limitCheck.current,
        remaining: limitCheck.remaining,
        unlimited: limitCheck.unlimited,
      },
    };
  } catch (error) {
    console.error('Subscription guard error:', error);
    return {
      allowed: false,
      reason: 'Unable to verify subscription permissions. Please try again.',
    };
  }
}

/**
 * API Route wrapper for subscription protection
 * Use this to wrap API routes that need subscription enforcement
 */
export function withSubscriptionGuard(
  handler: (req: NextRequest, guardResult: GuardResult) => Promise<NextResponse>,
  options: SubscriptionGuardOptions
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Check authentication first
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Run subscription guard
      const guardResult = await subscriptionGuard(session.user.id, options);

      if (!guardResult.allowed) {
        return NextResponse.json(
          {
            error: guardResult.reason || 'Subscription limit exceeded',
            subscription: guardResult.subscription,
            usage: guardResult.usage,
            limits: guardResult.limits,
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }

      // Pass guard result to handler for additional context
      return handler(req, guardResult);
    } catch (error) {
      console.error('Subscription guard wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * React hook for subscription checks in components
 */
export interface UseSubscriptionGuardResult {
  checkPermission: (options: SubscriptionGuardOptions) => Promise<GuardResult>;
  canProcessVideo: boolean;
  canUseAI: boolean;
  subscription: any;
  usage: any;
  loading: boolean;
}

/**
 * Format limit messages for user display
 */
export function formatLimitMessage(
  action: string,
  current: number,
  limit: number,
  isUnlimited: boolean,
  tier: string
): string {
  if (isUnlimited) {
    return `You have unlimited ${action} with your ${tier} subscription.`;
  }

  const remaining = Math.max(0, limit - current);
  
  switch (action) {
    case 'generate_note':
      if (remaining === 0) {
        return `You've reached your monthly limit of ${limit} notes. Upgrade to get unlimited note generation.`;
      }
      return `You have ${remaining} of ${limit} note${remaining !== 1 ? 's' : ''} remaining this month.`;
      
    default:
      return `You have ${remaining} of ${limit} ${action} remaining.`;
  }
}

/**
 * Get upgrade suggestion based on current tier and needed action
 */
export function getUpgradeSuggestion(
  currentTier: SubscriptionTier,
  action: string
): { suggestedTier: SubscriptionTier; reason: string; price: string } {
  switch (action) {
    case 'generate_note':
      if (currentTier === 'free') {
        return {
          suggestedTier: 'basic',
          reason: 'Get unlimited note generation',
          price: '$3.99/month',
        };
      }
      break;
  }

  // Default to Pro upgrade
  return {
    suggestedTier: 'pro',
    reason: 'Unlock all features and unlimited usage',
    price: '$9.99/month',
  };
}

/**
 * Check if user can access specific export format
 */
export function canExportFormat(subscription: any, format: string): boolean {
  const allowedFormats = subscription.tier === 'free' 
    ? ['pdf', 'markdown', 'html'] // All basic formats but with watermark
    : subscription.tier === 'basic'
    ? ['pdf', 'markdown', 'html']
    : ['pdf', 'markdown', 'html', 'docx', 'pptx'];
    
  return allowedFormats.includes(format);
}

/**
 * Get processing priority based on subscription tier
 */
export function getProcessingPriority(subscription: any): 'low' | 'medium' | 'high' {
  switch (subscription.tier) {
    case 'pro':
      return 'high'; // 2x faster processing
    case 'basic':
      return 'medium';
    case 'free':
    default:
      return 'low';
  }
}