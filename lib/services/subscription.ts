// Subscription Service
// Handles subscription management and usage tracking
// TODO: Update database schema to include subscription fields

import { db } from '../db/connection';
import { users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { USAGE_LIMITS } from '../stripe/config';
import { memoryCache, CacheKeys, CacheTTL } from '../cache/memory-cache';
import { auditLogger } from '../audit/logger';

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

// UUID validation helper
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Get user's current subscription
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    // Validate UUID first
    if (!userId || !isValidUUID(userId)) {
      console.error('Invalid user ID provided:', userId);
      return null;
    }

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
    
    // Don't return fallback with invalid UUID - return null instead
    // This prevents propagating invalid data to other functions
    if (!userId || !isValidUUID(userId)) {
      console.error('Cannot create fallback subscription for invalid user ID:', userId);
      return null;
    }
    
    // Return fallback data only for valid UUIDs
    const fallbackSubscription: UserSubscription = {
      id: userId,
      userId: userId,
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
  // Validate UUID first
  if (!userId || !isValidUUID(userId)) {
    console.error('Invalid user ID provided to getUserUsage:', userId);
    throw new Error('Invalid user ID format. Expected UUID.');
  }

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

// 🔒 SECURITY: Atomic usage reservation to prevent race conditions
export async function reserveUsage(
  userId: string, 
  action: 'generate_note' | 'use_storage',
  amount: number = 1
): Promise<{ success: boolean; reason?: string; reservationId?: string }> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return { success: false, reason: 'No subscription found' };
    }

    const limits = USAGE_LIMITS[subscription.tier];
    const reservationId = crypto.randomUUID();
    
    // Use database transaction for atomic check-and-reserve
    const result = await db.transaction(async (tx: PgTransaction<any, any, any>) => {
      // Get current usage within transaction
      const currentUser = await tx
        .select({
          videosProcessedThisMonth: users.videosProcessedThisMonth,
          storageUsedMb: users.storageUsedMb,
          resetDate: users.resetDate,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!currentUser.length) {
        throw new Error('User not found');
      }

      const userData = currentUser[0];
      
      // Check if monthly reset is needed
      const now = new Date();
      const shouldReset = !userData.resetDate || userData.resetDate < new Date(now.getFullYear(), now.getMonth(), 1);
      
      let currentUsage = userData.videosProcessedThisMonth || 0;
      if (shouldReset && action === 'generate_note') {
        currentUsage = 0;
      }
      
      // Check limits
      switch (action) {
        case 'generate_note':
          if (limits.videosPerMonth !== -1 && currentUsage + amount > limits.videosPerMonth) {
            throw new Error('Monthly note generation limit would be exceeded');
          }
          
          // Atomically increment usage
          const updateData: any = {
            videosProcessedThisMonth: sql`COALESCE(${users.videosProcessedThisMonth}, 0) + ${amount}`,
            updatedAt: new Date(),
          };
          
          if (shouldReset) {
            updateData.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            updateData.videosProcessedThisMonth = amount; // Start fresh
          }
          
          await tx.update(users).set(updateData).where(eq(users.id, userId));
          break;
          
        case 'use_storage':
          const storageLimitMB = limits.storageGB === -1 ? Number.MAX_SAFE_INTEGER : limits.storageGB * 1024;
          const currentStorageMB = userData.storageUsedMb || 0;
          
          if (currentStorageMB + amount > storageLimitMB) {
            throw new Error('Storage limit would be exceeded');
          }
          
          await tx.update(users)
            .set({
              storageUsedMb: sql`COALESCE(${users.storageUsedMb}, 0) + ${amount}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
          break;
          
        default:
          throw new Error('Unknown action');
      }
      
      return reservationId;
    });

    // 🔒 AUDIT: Log successful usage reservation
    await auditLogger.logEvent({
      eventType: 'data_access',
      userId,
      action: 'usage_reserved',
      details: { action, amount, reservationId: result },
      severity: 'low',
      source: 'subscription_service'
    });
    
    console.log('🔒 Usage reserved successfully:', { userId, action, amount, reservationId: result });
    return { success: true, reservationId: result };
    
  } catch (error) {
    console.error('🔒 Error reserving usage:', error);
    
    // 🔒 AUDIT: Log usage reservation failure
    await auditLogger.logUsageLimitExceeded(
      userId,
      action,
      0, // Current usage not available in error case
      -1, // Limit not available in error case  
      `reserve_${action}`,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
    
    return { 
      success: false, 
      reason: error instanceof Error ? error.message : 'Error reserving usage' 
    };
  }
}

// Check if user can perform an action (read-only check, no reservation)
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

// Increment storage usage (atomic operation)
export async function incrementStorageUsage(
  userId: string, 
  sizeMB: number
): Promise<void> {
  try {
    // Convert to integer MB - round up for any non-zero value to ensure storage is tracked
    const integerMB = sizeMB > 0 ? Math.max(1, Math.ceil(sizeMB)) : 0;
    
    // Use atomic SQL increment to prevent race conditions
    await db
      .update(users)
      .set({
        storageUsedMb: sql`COALESCE(${users.storageUsedMb}, 0) + ${integerMB}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log('Storage usage incremented successfully:', { userId, originalSizeMB: sizeMB, trackedMB: integerMB });
  } catch (error) {
    console.error('Error incrementing storage usage:', error);
    throw error;
  }
}

// Decrement storage usage (atomic operation)
export async function decrementStorageUsage(
  userId: string, 
  sizeMB: number
): Promise<void> {
  try {
    // Convert to integer MB - round up for any non-zero value to match increment logic
    const integerMB = sizeMB > 0 ? Math.max(1, Math.ceil(sizeMB)) : 0;
    
    // Use atomic SQL decrement, ensuring storage never goes below 0
    await db
      .update(users)
      .set({
        storageUsedMb: sql`GREATEST(COALESCE(${users.storageUsedMb}, 0) - ${integerMB}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log('Storage usage decremented successfully:', { userId, originalSizeMB: sizeMB, trackedMB: integerMB });
  } catch (error) {
    console.error('Error decrementing storage usage:', error);
    throw error;
  }
}

// Recalculate and correct storage usage for a user
export async function recalculateUserStorage(userId: string): Promise<{
  success: boolean;
  oldUsage?: number;
  newUsage?: number;
  error?: string;
}> {
  try {
    // This would require calculating actual stored content size
    // For now, we'll implement a basic version that ensures consistency
    const currentUser = await db
      .select({ storageUsedMb: users.storageUsedMb })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser.length) {
      return { success: false, error: 'User not found' };
    }

    const oldUsage = currentUser[0].storageUsedMb || 0;
    
    // TODO: In a future version, this could scan all user's notes and calculate actual size
    // For now, just ensure the value is not negative
    if (oldUsage < 0) {
      await db
        .update(users)
        .set({
          storageUsedMb: 0,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
      
      return { success: true, oldUsage, newUsage: 0 };
    }

    return { success: true, oldUsage, newUsage: oldUsage };
  } catch (error) {
    console.error('Error recalculating storage usage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to recalculate storage' };
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