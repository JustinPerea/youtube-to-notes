// Subscription Service
// Handles subscription management and usage tracking
// TODO: Update database schema to include subscription fields

import { db } from '../db/connection';
import { users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { USAGE_LIMITS } from '../stripe/config';
import { memoryCache, CacheKeys, CacheTTL } from '../cache/memory-cache';

export interface UserSubscription {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  tier: 'free' | 'basic' | 'pro';
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
  notesGenerated: number;
  storageUsedMB: number;
  resetAt: Date;
}

// Get user's current subscription
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const cacheKey = CacheKeys.USER_SUBSCRIPTION(userId);
    
    // Check cache first
    const cachedSubscription = memoryCache.get<UserSubscription>(cacheKey);
    if (cachedSubscription) {
      return cachedSubscription;
    }

    // Get user data from database with subscription info
    const user = await db
      .select({
        id: users.id,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
        subscriptionCurrentPeriodStart: users.subscriptionCurrentPeriodStart,
        subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
        subscriptionCancelAtPeriodEnd: users.subscriptionCancelAtPeriodEnd,
        adminOverrideTier: users.adminOverrideTier,
        adminOverrideExpires: users.adminOverrideExpires,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return null;
    }

    const userData = user[0];
    
    // Check if admin override is active
    let effectiveTier = userData.subscriptionTier;
    if (userData.adminOverrideTier && userData.adminOverrideExpires && userData.adminOverrideExpires > new Date()) {
      effectiveTier = userData.adminOverrideTier;
    }

    const subscription: UserSubscription = {
      id: userData.id,
      userId,
      stripeCustomerId: userData.stripeCustomerId || undefined,
      stripeSubscriptionId: userData.stripeSubscriptionId || undefined,
      tier: (effectiveTier as 'free' | 'basic' | 'pro') || 'free',
      status: (userData.subscriptionStatus as 'active' | 'cancelled' | 'past_due' | 'incomplete') || 'active',
      currentPeriodStart: userData.subscriptionCurrentPeriodStart || undefined,
      currentPeriodEnd: userData.subscriptionCurrentPeriodEnd || undefined,
      cancelAtPeriodEnd: userData.subscriptionCancelAtPeriodEnd || false,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
    
    // Cache the result
    memoryCache.set(cacheKey, subscription, CacheTTL.USER_SUBSCRIPTION);
    
    return subscription;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    
    // Return fallback data to prevent complete failure
    const fallbackSubscription: UserSubscription = {
      id: userId || 'anonymous',
      userId: userId || 'anonymous',
      tier: 'free',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Cache fallback briefly (1 minute) to prevent repeated errors
    const cacheKey = CacheKeys.USER_SUBSCRIPTION(userId);
    memoryCache.set(cacheKey, fallbackSubscription, 60 * 1000);
    
    return fallbackSubscription;
  }
}

// Update user subscription (called from Stripe webhooks)
export async function updateUserSubscription(
  userId: string, 
  subscriptionData: Partial<UserSubscription>
): Promise<void> {
  try {
    // Build update object only with defined values
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (subscriptionData.stripeCustomerId !== undefined) {
      updateData.stripeCustomerId = subscriptionData.stripeCustomerId;
    }
    if (subscriptionData.stripeSubscriptionId !== undefined) {
      updateData.stripeSubscriptionId = subscriptionData.stripeSubscriptionId;
    }
    if (subscriptionData.tier !== undefined) {
      updateData.subscriptionTier = subscriptionData.tier;
    }
    if (subscriptionData.status !== undefined) {
      updateData.subscriptionStatus = subscriptionData.status;
    }
    if (subscriptionData.currentPeriodStart !== undefined) {
      updateData.subscriptionCurrentPeriodStart = subscriptionData.currentPeriodStart;
    }
    if (subscriptionData.currentPeriodEnd !== undefined) {
      updateData.subscriptionCurrentPeriodEnd = subscriptionData.currentPeriodEnd;
    }
    if (subscriptionData.cancelAtPeriodEnd !== undefined) {
      updateData.subscriptionCancelAtPeriodEnd = subscriptionData.cancelAtPeriodEnd;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    // Clear cache to force refresh on next read
    const cacheKey = CacheKeys.USER_SUBSCRIPTION(userId);
    memoryCache.delete(cacheKey);

    console.log('Subscription updated successfully:', { userId, subscriptionData });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

// Get user's current month usage
export async function getUserUsage(userId: string): Promise<UsageData> {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  try {
    // Get current usage from database
    const user = await db
      .select({
        videosProcessedThisMonth: users.videosProcessedThisMonth,
        storageUsedMb: users.storageUsedMb,
        resetDate: users.resetDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new Error('User not found');
    }

    const userData = user[0];
    const now = new Date();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // Check if we need to reset monthly counters
    const shouldResetVideos = !userData.resetDate || userData.resetDate < new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (shouldResetVideos) {
      const updateData: any = {
        videosProcessedThisMonth: 0,
        resetDate: nextMonthStart,
      };
      
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      
      // Return reset values
      return {
        userId,
        month: currentMonth,
        notesGenerated: shouldResetVideos ? 0 : (userData.videosProcessedThisMonth || 0),
        storageUsedMB: userData.storageUsedMb || 0,
        resetAt: nextMonthStart,
      };
    }

    return {
      userId,
      month: currentMonth,
      notesGenerated: userData.videosProcessedThisMonth || 0,
      storageUsedMB: userData.storageUsedMb || 0,
      resetAt: userData.resetDate || nextMonthStart,
    };
  } catch (error) {
    console.error('Error getting user usage:', error);
    throw error;
  }
}

// Check if user can perform an action based on their tier and usage
export async function checkUsageLimit(
  userId: string, 
  action: 'generate_note' | 'use_storage'
): Promise<{ allowed: boolean; reason?: string; limit?: number; current?: number }> {
  try {
    const subscription = await getUserSubscription(userId);
    const usage = await getUserUsage(userId);
    
    if (!subscription) {
      return { allowed: false, reason: 'No subscription found' };
    }

    const limits = USAGE_LIMITS[subscription.tier];
    
    switch (action) {
      case 'generate_note':
        if (limits.videosPerMonth === -1) {
          return { allowed: true }; // Unlimited
        }
        const noteAllowed = usage.notesGenerated < limits.videosPerMonth;
        return {
          allowed: noteAllowed,
          reason: noteAllowed ? undefined : 'Monthly note generation limit reached',
          limit: limits.videosPerMonth,
          current: usage.notesGenerated,
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
  action: 'generate_note',
  amount: number = 1
): Promise<void> {
  try {
    if (action === 'generate_note') {
      // Increment note generation counter using raw SQL for atomic increment
      await db
        .update(users)
        .set({
          videosProcessedThisMonth: sql`COALESCE(${users.videosProcessedThisMonth}, 0) + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    console.log('Usage incremented successfully:', { userId, action, amount });
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
    basic: {
      name: 'Basic',
      color: 'blue',
      features: ['Unlimited videos', 'Study notes', 'AI chat (10/month)', '5GB storage'],
      upgradeAvailable: true,
    },
    pro: {
      name: 'Pro',
      color: 'pink',
      features: ['Unlimited videos', 'All formats', 'Unlimited AI chat', '50GB storage'],
      upgradeAvailable: false,
    },
  };

  return tierInfo[subscription.tier as 'basic' | 'pro'] || tierInfo.basic;
}