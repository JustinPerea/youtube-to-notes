/**
 * Subscription Service - Comprehensive Implementation
 * Handles subscription limits, usage tracking, and enforcement
 */

import { db } from '../db/connection';
import { users, userMonthlyUsage, aiChatSessions } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier, checkLimit, hasFeatureAccess } from './config';
import { auditLogger } from '../audit/logger';
import { randomUUID } from 'crypto';

// UUID validation helper
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  adminOverride?: {
    tier: SubscriptionTier;
    expires?: Date;
  };
}

export interface UsageData {
  userId: string;
  month: string;
  subscription: UserSubscription;
  
  // Current usage
  videosProcessed: number;
  aiQuestionsAsked: number;
  storageUsedMb: number;
  
  // Limits
  videoLimit: number; // -1 = unlimited
  aiQuestionLimit: number; // -1 = unlimited, 0 = disabled
  storageLimitMb: number;
  
  // Status
  canProcessVideo: boolean;
  canUseAI: boolean;
  canUseStorage: boolean;
  
  // Reset info
  resetDate: Date;
}

// Get user's current subscription with admin override support
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  // Validate UUID first
  if (!userId || !isValidUUID(userId)) {
    console.error('Invalid user ID provided to getUserSubscription:', userId);
    return null;
  }

  try {
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
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return null;
    }

    const userData = user[0];
    
    // Determine effective tier (admin override takes precedence)
    let effectiveTier: SubscriptionTier = userData.subscriptionTier as SubscriptionTier || 'free';
    let adminOverride: UserSubscription['adminOverride'] = undefined;
    
    if (userData.adminOverrideTier && 
        (!userData.adminOverrideExpires || userData.adminOverrideExpires > new Date())) {
      effectiveTier = userData.adminOverrideTier as SubscriptionTier;
      adminOverride = {
        tier: userData.adminOverrideTier as SubscriptionTier,
        expires: userData.adminOverrideExpires || undefined,
      };
    }

    return {
      id: userData.id,
      userId,
      tier: effectiveTier,
      status: (userData.subscriptionStatus as any) || 'active',
      stripeCustomerId: userData.stripeCustomerId || undefined,
      stripeSubscriptionId: userData.stripeSubscriptionId || undefined,
      currentPeriodStart: userData.subscriptionCurrentPeriodStart || undefined,
      currentPeriodEnd: userData.subscriptionCurrentPeriodEnd || undefined,
      cancelAtPeriodEnd: userData.subscriptionCancelAtPeriodEnd || false,
      adminOverride,
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

// Get comprehensive usage data
export async function getUserUsage(userId: string): Promise<UsageData | null> {
  // Validate UUID first
  if (!userId || !isValidUUID(userId)) {
    console.error('Invalid user ID provided to getUserUsage:', userId);
    return null;
  }

  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      console.error('No subscription found for user:', userId);
      // Return default usage data for free tier
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const limits = SUBSCRIPTION_LIMITS['free'];
      
      return {
        userId,
        month: currentMonth,
        subscription: {
          id: userId,
          userId,
          tier: 'free',
          status: 'active',
          currentPeriodEnd: undefined,
          cancelAtPeriodEnd: false,
        },
        
        // Current usage
        videosProcessed: 0,
        aiQuestionsAsked: 0,
        storageUsedMb: 0,
        
        // Limits
        videoLimit: limits.videosPerMonth,
        aiQuestionLimit: limits.aiQuestionsPerMonth,
        storageLimitMb: limits.storageGB * 1024,
        
        // Status checks
        canProcessVideo: limits.videosPerMonth === -1 || 0 < limits.videosPerMonth,
        canUseAI: limits.aiQuestionsPerMonth !== 0 && 
                  (limits.aiQuestionsPerMonth === -1 || 0 < limits.aiQuestionsPerMonth),
        canUseStorage: 0 < (limits.storageGB * 1024),
        
        // Reset date (first day of next month)
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      };
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const limits = SUBSCRIPTION_LIMITS[subscription.tier];
    
    // Get current usage from user_monthly_usage table
    const usageResult = await db
      .select()
      .from(userMonthlyUsage)
      .where(
        and(
          eq(userMonthlyUsage.userId, userId),
          eq(userMonthlyUsage.monthYear, currentMonth)
        )
      )
      .limit(1);

    const usage = usageResult[0];
    
    return {
      userId,
      month: currentMonth,
      subscription,
      
      // Current usage
      videosProcessed: usage?.videosProcessed || 0,
      aiQuestionsAsked: usage?.aiQuestionsAsked || 0,
      storageUsedMb: usage?.storageUsedMb || 0,
      
      // Limits
      videoLimit: limits.videosPerMonth,
      aiQuestionLimit: limits.aiQuestionsPerMonth,
      storageLimitMb: limits.storageGB * 1024,
      
      // Status checks
      canProcessVideo: limits.videosPerMonth === -1 || (usage?.videosProcessed || 0) < limits.videosPerMonth,
      canUseAI: limits.aiQuestionsPerMonth !== 0 && 
                (limits.aiQuestionsPerMonth === -1 || (usage?.aiQuestionsAsked || 0) < limits.aiQuestionsPerMonth),
      canUseStorage: (usage?.storageUsedMb || 0) < (limits.storageGB * 1024),
      
      // Reset date (first day of next month)
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    };
  } catch (error) {
    console.error('Error getting user usage:', error);
    return null;
  }
}

// Check if user can perform specific action
export async function checkUsageLimit(
  userId: string,
  action: 'generate_note' | 'ask_ai_question' | 'use_storage',
  amount: number = 1
): Promise<{
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
  remaining?: number;
  unlimited?: boolean;
}> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return { allowed: false, reason: 'User not found' };
    }

    console.log('🔍 checkUsageLimit debug:', {
      userId,
      action,
      subscriptionTier: subscription.tier,
      adminOverride: subscription.adminOverride
    });

    const limits = SUBSCRIPTION_LIMITS[subscription.tier];
    console.log('📊 Limits for tier:', subscription.tier, limits);
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get current usage from user_monthly_usage table
    let usageResult = await db
      .select()
      .from(userMonthlyUsage)
      .where(
        and(
          eq(userMonthlyUsage.userId, userId),
          eq(userMonthlyUsage.monthYear, currentMonth)
        )
      )
      .limit(1);

    let currentUsage = usageResult[0];

    // Create usage record if it doesn't exist
    if (!currentUsage) {
      const storageLimitMB = Math.round(limits.storageGB * 1024);
      
      console.log('📝 Creating new usage record:', {
        userId,
        monthYear: currentMonth,
        videosLimit: limits.videosPerMonth,
        aiQuestionsLimit: limits.aiQuestionsPerMonth,
        storageLimitMB,
        subscriptionTier: subscription.tier
      });
      
      await db
        .insert(userMonthlyUsage)
        .values({
          userId,
          monthYear: currentMonth,
          videosLimit: limits.videosPerMonth,
          aiQuestionsLimit: limits.aiQuestionsPerMonth,
          storageLimitMb: storageLimitMB,
          subscriptionTier: subscription.tier,
          videosProcessed: 0, // Still using videosProcessed in DB
          aiQuestionsAsked: 0,
          storageUsedMb: 0,
        });

      // Fetch the newly created record
      usageResult = await db
        .select()
        .from(userMonthlyUsage)
        .where(
          and(
            eq(userMonthlyUsage.userId, userId),
            eq(userMonthlyUsage.monthYear, currentMonth)
          )
        )
        .limit(1);

      currentUsage = usageResult[0];
    } else {
      // Update limits if subscription changed
      console.log('💾 Current usage record:', {
        currentVideosLimit: currentUsage.videosLimit,
        newVideosLimit: limits.videosPerMonth,
        currentAiLimit: currentUsage.aiQuestionsLimit,
        newAiLimit: limits.aiQuestionsPerMonth,
        needsUpdate: currentUsage.videosLimit !== limits.videosPerMonth || 
                    currentUsage.aiQuestionsLimit !== limits.aiQuestionsPerMonth
      });

      if (currentUsage.videosLimit !== limits.videosPerMonth || 
          currentUsage.aiQuestionsLimit !== limits.aiQuestionsPerMonth) {
        
        console.log('🔄 Updating usage limits from', 
          { videos: currentUsage.videosLimit, ai: currentUsage.aiQuestionsLimit }, 
          'to', 
          { videos: limits.videosPerMonth, ai: limits.aiQuestionsPerMonth }
        );

        const storageLimitMB = Math.round(limits.storageGB * 1024);
        
        await db
          .update(userMonthlyUsage)
          .set({
            videosLimit: limits.videosPerMonth,
            aiQuestionsLimit: limits.aiQuestionsPerMonth,
            storageLimitMb: storageLimitMB,
            subscriptionTier: subscription.tier,
            updatedAt: new Date(),
          })
          .where(eq(userMonthlyUsage.id, currentUsage.id));

        currentUsage.videosLimit = limits.videosPerMonth;
        currentUsage.aiQuestionsLimit = limits.aiQuestionsPerMonth;
        
        console.log('✅ Updated usage limits successfully');
      }
    }

    if (action === 'generate_note') {
      const limit = currentUsage.videosLimit; // Still using videosLimit from DB
      const current = currentUsage.videosProcessed || 0; // Still using videosProcessed from DB

      console.log('📝 Note limit check:', {
        limit,
        current,
        allowed: limit === -1 ? true : current < limit,
        unlimited: limit === -1
      });

      if (limit === -1) {
        return {
          allowed: true,
          unlimited: true,
          current,
          limit: -1
        };
      }

      const allowed = current < limit;
      return {
        allowed,
        limit,
        current,
        remaining: Math.max(0, limit - current),
        unlimited: false,
        reason: allowed ? undefined : 'Monthly video limit reached'
      };
    }

    if (action === 'ask_ai_question') {
      const limit = currentUsage.aiQuestionsLimit;
      const current = currentUsage.aiQuestionsAsked || 0;

      if (limit === 0) {
        return {
          allowed: false,
          limit: 0,
          current,
          remaining: 0,
          unlimited: false,
          reason: 'AI chat not available in your subscription tier'
        };
      }

      if (limit === -1) {
        return {
          allowed: true,
          unlimited: true,
          current,
          limit: -1
        };
      }

      const allowed = current < limit;
      return {
        allowed,
        limit,
        current,
        remaining: Math.max(0, limit - current),
        unlimited: false,
        reason: allowed ? undefined : 'Monthly AI chat limit reached'
      };
    }

    // Handle storage usage checks
    if (action === 'use_storage') {
      const storageLimitMB = limits.storageGB === -1 ? Number.MAX_SAFE_INTEGER : limits.storageGB * 1024;
      const currentStorageMB = currentUsage.storageUsedMb || 0;
      
      console.log('💾 Storage limit check:', {
        userId,
        storageLimitMB,
        currentStorageMB,
        requestedAmount: amount,
        allowed: currentStorageMB + amount <= storageLimitMB,
        unlimited: limits.storageGB === -1
      });

      if (limits.storageGB === -1) {
        return {
          allowed: true,
          unlimited: true,
          current: currentStorageMB,
          limit: -1
        };
      }

      const allowed = currentStorageMB + amount <= storageLimitMB;
      return {
        allowed,
        limit: storageLimitMB,
        current: currentStorageMB,
        remaining: Math.max(0, storageLimitMB - currentStorageMB),
        unlimited: false,
        reason: allowed ? undefined : 'Storage limit reached'
      };
    }

    return { allowed: false, reason: 'Unknown action' };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { allowed: false, reason: 'Error checking limits' };
  }
}

// Increment usage after successful action
export async function incrementUsage(
  userId: string,
  action: 'generate_note' | 'ask_ai_question',
  amount: number = 1
): Promise<boolean> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // Get current usage or create if doesn't exist
    let usageResult = await db
      .select()
      .from(userMonthlyUsage)
      .where(
        and(
          eq(userMonthlyUsage.userId, userId),
          eq(userMonthlyUsage.monthYear, currentMonth)
        )
      )
      .limit(1);

    let currentUsage = usageResult[0];

    if (!currentUsage) {
      // Create new usage record with current subscription limits
      const subscription = await getUserSubscription(userId);
      if (!subscription) return false;

      const limits = SUBSCRIPTION_LIMITS[subscription.tier];
      
      const storageLimitMB = Math.round(limits.storageGB * 1024);
      
      const newUsage = await db
        .insert(userMonthlyUsage)
        .values({
          userId,
          monthYear: currentMonth,
          videosLimit: limits.videosPerMonth,
          aiQuestionsLimit: limits.aiQuestionsPerMonth,
          storageLimitMb: storageLimitMB,
          subscriptionTier: subscription.tier,
          videosProcessed: action === 'generate_note' ? amount : 0,
          aiQuestionsAsked: action === 'ask_ai_question' ? amount : 0,
          storageUsedMb: 0,
        })
        .returning();

      return newUsage.length > 0;
    }

    // Update the usage record with current subscription limits if they've changed
    const subscription = await getUserSubscription(userId);
    if (subscription) {
      const limits = SUBSCRIPTION_LIMITS[subscription.tier];
      if (currentUsage.videosLimit !== limits.videosPerMonth || 
          currentUsage.aiQuestionsLimit !== limits.aiQuestionsPerMonth) {
        const storageLimitMB = Math.round(limits.storageGB * 1024);
        
        await db
          .update(userMonthlyUsage)
          .set({
            videosLimit: limits.videosPerMonth,
            aiQuestionsLimit: limits.aiQuestionsPerMonth,
            storageLimitMb: storageLimitMB,
            subscriptionTier: subscription.tier,
            updatedAt: new Date(),
          })
          .where(eq(userMonthlyUsage.id, currentUsage.id));
        
        // Refresh the usage record
        const refreshedUsage = await db
          .select()
          .from(userMonthlyUsage)
          .where(eq(userMonthlyUsage.id, currentUsage.id))
          .limit(1);
        
        if (refreshedUsage[0]) {
          currentUsage = refreshedUsage[0];
        }
      }
    }

    // Update existing usage record
    if (action === 'generate_note') {
      await db
        .update(userMonthlyUsage)
        .set({
          videosProcessed: (currentUsage.videosProcessed || 0) + amount, // Still using videosProcessed in DB
          updatedAt: new Date(),
        })
        .where(eq(userMonthlyUsage.id, currentUsage.id));
    } else if (action === 'ask_ai_question') {
      await db
        .update(userMonthlyUsage)
        .set({
          aiQuestionsAsked: (currentUsage.aiQuestionsAsked || 0) + amount,
          updatedAt: new Date(),
        })
        .where(eq(userMonthlyUsage.id, currentUsage.id));
    }

    return true;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return false;
  }
}

// Record AI chat session
export async function recordAIChatSession(
  userId: string,
  question: string,
  response: string,
  videoId?: string,
  noteId?: string,
  tokensUsed?: number,
  costInCents?: number
): Promise<void> {
  try {
    await db.insert(aiChatSessions).values({
      userId,
      question,
      response,
      videoId,
      noteId,
      tokensUsed,
      costInCents,
    });
    
    // Increment AI question usage
    await incrementUsage(userId, 'ask_ai_question');
  } catch (error) {
    console.error('Error recording AI chat session:', error);
    throw error;
  }
}

// Update subscription (called from Stripe webhooks)
export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    tier?: SubscriptionTier;
    status?: 'active' | 'canceled' | 'past_due' | 'incomplete';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  }
): Promise<void> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (subscriptionData.tier) updateData.subscriptionTier = subscriptionData.tier;
    if (subscriptionData.status) updateData.subscriptionStatus = subscriptionData.status;
    if (subscriptionData.stripeCustomerId) updateData.stripeCustomerId = subscriptionData.stripeCustomerId;
    if (subscriptionData.stripeSubscriptionId) updateData.stripeSubscriptionId = subscriptionData.stripeSubscriptionId;
    if (subscriptionData.currentPeriodStart) updateData.subscriptionCurrentPeriodStart = subscriptionData.currentPeriodStart;
    if (subscriptionData.currentPeriodEnd) updateData.subscriptionCurrentPeriodEnd = subscriptionData.currentPeriodEnd;
    if (subscriptionData.cancelAtPeriodEnd !== undefined) updateData.subscriptionCancelAtPeriodEnd = subscriptionData.cancelAtPeriodEnd;
    
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

// Admin functions for testing
export async function setAdminOverride(
  userId: string,
  tier: SubscriptionTier,
  expiresInHours?: number
): Promise<void> {
  try {
    const expires = expiresInHours 
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;
    
    await db
      .update(users)
      .set({
        adminOverrideTier: tier,
        adminOverrideExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Error setting admin override:', error);
    throw error;
  }
}

export async function clearAdminOverride(userId: string): Promise<void> {
  try {
    await db
      .update(users)
      .set({
        adminOverrideTier: null,
        adminOverrideExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Error clearing admin override:', error);
    throw error;
  }
}

// Feature access helpers
export function canAccessFeature(subscription: UserSubscription, feature: string): boolean {
  return hasFeatureAccess(subscription.tier, feature);
}

export function getAvailableFormats(subscription: UserSubscription): string[] {
  return SUBSCRIPTION_LIMITS[subscription.tier].availableFormats;
}

export function getExportFormats(subscription: UserSubscription): string[] {
  return SUBSCRIPTION_LIMITS[subscription.tier].exportFormats;
}

export function hasWatermark(subscription: UserSubscription): boolean {
  return SUBSCRIPTION_LIMITS[subscription.tier].watermarkOnExports;
}

export function getProcessingSpeed(subscription: UserSubscription): 'standard' | 'priority' {
  return SUBSCRIPTION_LIMITS[subscription.tier].processingSpeed;
}

// Increment storage usage (atomic operation)
export async function incrementStorageUsage(
  userId: string, 
  sizeMB: number
): Promise<void> {
  try {
    // Convert to integer MB - round up for any non-zero value to ensure we track storage properly
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

    const limits = SUBSCRIPTION_LIMITS[subscription.tier];
    const reservationId = randomUUID();
    
    // Use database transaction for atomic check-and-reserve
    const result = await db.transaction(async (tx: PgTransaction<any, any, any>) => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Get current usage within transaction
      let usageResult = await tx
        .select()
        .from(userMonthlyUsage)
        .where(
          and(
            eq(userMonthlyUsage.userId, userId),
            eq(userMonthlyUsage.monthYear, currentMonth)
          )
        )
        .limit(1);

      let currentUsage = usageResult[0];

      // Create usage record if it doesn't exist
      if (!currentUsage) {
        const storageLimitMB = Math.round(limits.storageGB * 1024);
        
        await tx.insert(userMonthlyUsage).values({
          userId,
          monthYear: currentMonth,
          videosLimit: limits.videosPerMonth,
          aiQuestionsLimit: limits.aiQuestionsPerMonth,
          storageLimitMb: storageLimitMB,
          subscriptionTier: subscription.tier,
          videosProcessed: 0,
          aiQuestionsAsked: 0,
          storageUsedMb: 0,
        });
        
        // Fetch the newly created record
        usageResult = await tx
          .select()
          .from(userMonthlyUsage)
          .where(
            and(
              eq(userMonthlyUsage.userId, userId),
              eq(userMonthlyUsage.monthYear, currentMonth)
            )
          )
          .limit(1);

        currentUsage = usageResult[0];
      }
      
      // Check limits and atomically increment
      switch (action) {
        case 'generate_note':
          const videoLimit = limits.videosPerMonth;
          const currentVideos = currentUsage.videosProcessed || 0;
          
          if (videoLimit !== -1 && currentVideos + amount > videoLimit) {
            throw new Error('Monthly note generation limit would be exceeded');
          }
          
          // Atomically increment usage
          await tx
            .update(userMonthlyUsage)
            .set({
              videosProcessed: sql`COALESCE(${userMonthlyUsage.videosProcessed}, 0) + ${amount}`,
              updatedAt: new Date(),
            })
            .where(eq(userMonthlyUsage.id, currentUsage.id));
          break;
          
        case 'use_storage':
          const storageLimitMB = limits.storageGB === -1 ? Number.MAX_SAFE_INTEGER : limits.storageGB * 1024;
          const currentStorageMB = currentUsage.storageUsedMb || 0;
          
          if (currentStorageMB + amount > storageLimitMB) {
            throw new Error('Storage limit would be exceeded');
          }
          
          await tx
            .update(userMonthlyUsage)
            .set({
              storageUsedMb: sql`COALESCE(${userMonthlyUsage.storageUsedMb}, 0) + ${amount}`,
              updatedAt: new Date(),
            })
            .where(eq(userMonthlyUsage.id, currentUsage.id));
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