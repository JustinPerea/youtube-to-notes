// Subscription Service
// Handles subscription management and usage tracking
// TODO: Update database schema to include subscription fields

import { db } from '../db/connection';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { USAGE_LIMITS } from '../stripe/config';

export interface UserSubscription {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  tier: 'free' | 'student' | 'pro' | 'creator';
  status: 'active' | 'cancelled' | 'past_due' | 'incomplete';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageData {
  userId: string;
  month: string; // Format: YYYY-MM
  videosProcessed: number;
  aiQuestionsAsked: number;
  storageUsedMB: number;
  resetAt: Date;
}

// Get user's current subscription
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    // TODO: Update this query once subscription columns are added to users table
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return null;
    }

    // For now, return a default free subscription
    // This will be replaced with actual subscription data from database
    return {
      id: userId,
      userId,
      tier: 'free', // TODO: Get from database
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

// Update user subscription (called from Stripe webhooks)
export async function updateUserSubscription(
  userId: string, 
  subscriptionData: Partial<UserSubscription>
): Promise<void> {
  try {
    // TODO: Update users table with subscription data
    // await db
    //   .update(users)
    //   .set({
    //     stripeCustomerId: subscriptionData.stripeCustomerId,
    //     stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
    //     subscriptionTier: subscriptionData.tier,
    //     subscriptionStatus: subscriptionData.status,
    //     subscriptionCurrentPeriodStart: subscriptionData.currentPeriodStart,
    //     subscriptionCurrentPeriodEnd: subscriptionData.currentPeriodEnd,
    //     subscriptionCancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(users.id, userId));

    console.log('Subscription update (placeholder):', { userId, subscriptionData });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

// Get user's current month usage
export async function getUserUsage(userId: string): Promise<UsageData> {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  try {
    // TODO: Query actual usage from database
    // For now, return placeholder data
    return {
      userId,
      month: currentMonth,
      videosProcessed: 0, // TODO: Get from database
      aiQuestionsAsked: 0, // TODO: Get from database
      storageUsedMB: 0, // TODO: Calculate from user's files
      resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    };
  } catch (error) {
    console.error('Error getting user usage:', error);
    throw error;
  }
}

// Check if user can perform an action based on their tier and usage
export async function checkUsageLimit(
  userId: string, 
  action: 'process_video' | 'ask_ai_question' | 'use_storage'
): Promise<{ allowed: boolean; reason?: string; limit?: number; current?: number }> {
  try {
    const subscription = await getUserSubscription(userId);
    const usage = await getUserUsage(userId);
    
    if (!subscription) {
      return { allowed: false, reason: 'No subscription found' };
    }

    const limits = USAGE_LIMITS[subscription.tier];
    
    switch (action) {
      case 'process_video':
        if (limits.videosPerMonth === -1) {
          return { allowed: true }; // Unlimited
        }
        const videoAllowed = usage.videosProcessed < limits.videosPerMonth;
        return {
          allowed: videoAllowed,
          reason: videoAllowed ? undefined : 'Monthly video limit reached',
          limit: limits.videosPerMonth,
          current: usage.videosProcessed,
        };

      case 'ask_ai_question':
        if (limits.aiQuestionsPerMonth === -1) {
          return { allowed: true }; // Unlimited
        }
        if (limits.aiQuestionsPerMonth === 0) {
          return { 
            allowed: false, 
            reason: 'AI chat not available in free tier',
            limit: 0,
            current: usage.aiQuestionsAsked,
          };
        }
        const questionAllowed = usage.aiQuestionsAsked < limits.aiQuestionsPerMonth;
        return {
          allowed: questionAllowed,
          reason: questionAllowed ? undefined : 'Monthly AI question limit reached',
          limit: limits.aiQuestionsPerMonth,
          current: usage.aiQuestionsAsked,
        };

      case 'use_storage':
        if (limits.storageGB === -1) {
          return { allowed: true }; // Unlimited
        }
        const storageLimitMB = limits.storageGB * 1024;
        const storageAllowed = usage.storageUsedMB < storageLimitMB;
        return {
          allowed: storageAllowed,
          reason: storageAllowed ? undefined : 'Storage limit reached',
          limit: storageLimitMB,
          current: usage.storageUsedMB,
        };

      default:
        return { allowed: false, reason: 'Unknown action' };
    }
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { allowed: false, reason: 'Error checking limits' };
  }
}

// Increment usage counter
export async function incrementUsage(
  userId: string, 
  action: 'process_video' | 'ask_ai_question',
  amount: number = 1
): Promise<void> {
  try {
    // TODO: Increment usage in database
    console.log('Usage increment (placeholder):', { userId, action, amount });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    throw error;
  }
}

// Get subscription tier display info
export function getSubscriptionDisplayInfo(subscription: UserSubscription | null) {
  if (!subscription || subscription.tier === 'free') {
    return {
      name: 'Free',
      color: 'gray',
      features: ['5 videos/month', 'Basic formats', 'PDF export'],
      upgradeAvailable: true,
    };
  }

  const tierInfo = {
    student: {
      name: 'Student',
      color: 'blue',
      features: ['25 videos/month', 'Study notes', 'AI chat (10/month)', '1GB storage'],
      upgradeAvailable: true,
    },
    pro: {
      name: 'Pro',
      color: 'pink',
      features: ['100 videos/month', 'All formats', 'Unlimited AI chat', '10GB storage'],
      upgradeAvailable: true,
    },
    creator: {
      name: 'Creator',
      color: 'gold',
      features: ['Unlimited videos', 'API access', 'White-label', 'Unlimited storage'],
      upgradeAvailable: false,
    },
  };

  return tierInfo[subscription.tier] || tierInfo.student;
}