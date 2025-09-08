/**
 * Admin API for testing subscription tiers
 * Allows overriding user subscription levels without Stripe payments
 * 
 * Security: Only works in development mode or with admin credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { setAdminOverride, clearAdminOverride, getUserSubscription } from '@/lib/subscription/service';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/subscription/config';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/admin/config';
import { auditLogger } from '@/lib/audit/logger';

// Helper function to ensure user exists in database
async function ensureUserExists(sessionUser: { id: string; email: string; name?: string; image?: string }) {
  try {
    // Check if user exists by OAuth ID
    let existingUser = await db
      .select()
      .from(users)
      .where(eq(users.oauthId, sessionUser.id))
      .limit(1);

    if (existingUser.length > 0) {
      return existingUser[0].id; // Return the database UUID
    }

    // Check if user exists by email (legacy)
    existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, sessionUser.email))
      .limit(1);

    if (existingUser.length > 0) {
      // Update with OAuth ID
      await db
        .update(users)
        .set({
          oauthId: sessionUser.id,
          oauthProvider: 'google',
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id));
      
      return existingUser[0].id;
    }

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        email: sessionUser.email,
        name: sessionUser.name,
        image: sessionUser.image,
        oauthId: sessionUser.id,
        oauthProvider: 'google',
        subscriptionTier: 'free', // Default tier
      })
      .returning();

    return newUser[0].id;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

// POST /api/admin/subscription-override - Set subscription override
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, tier, expiresInHours } = body;

    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'userId and tier are required' },
        { status: 400 }
      );
    }

    if (!['free', 'basic', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be free, student, or pro' },
        { status: 400 }
      );
    }

    // Ensure user exists and get the proper database UUID
    const dbUserId = await ensureUserExists({
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name ?? undefined,
      image: session.user.image ?? undefined
    });

    // 🔒 AUDIT: Log admin override action
    await auditLogger.logEvent({
      eventType: 'admin_override',
      userId: dbUserId,
      userEmail: session.user.email!,
      action: 'subscription_override_set',
      details: { tier, expiresInHours, adminUser: session.user.email },
      severity: 'high',
      source: 'admin_api',
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    });
    
    // Set the override using database user ID, not session user ID
    console.log('🔧 Setting admin override:', { dbUserId, tier, expiresInHours });
    await setAdminOverride(dbUserId, tier as SubscriptionTier, expiresInHours);

    // Get updated subscription info
    console.log('🔍 Getting updated subscription after override');
    const subscription = await getUserSubscription(dbUserId);
    console.log('📋 Updated subscription:', subscription);
    
    const limits = SUBSCRIPTION_LIMITS[tier as SubscriptionTier];
    console.log('📊 Limits for new tier:', limits);

    return NextResponse.json({
      success: true,
      message: `Subscription override set to ${tier}${expiresInHours ? ` for ${expiresInHours} hours` : ''}`,
      subscription,
      limits: {
        videosPerMonth: limits.videosPerMonth === -1 ? 'unlimited' : limits.videosPerMonth,
        aiQuestionsPerMonth: limits.aiQuestionsPerMonth === -1 ? 'unlimited' : limits.aiQuestionsPerMonth,
        storageGB: limits.storageGB,
        availableFormats: limits.availableFormats,
        exportFormats: limits.exportFormats,
        processingSpeed: limits.processingSpeed,
      },
    });
  } catch (error) {
    console.error('Error setting subscription override:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to set subscription override',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/subscription-override - Clear subscription override
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // 🔒 AUDIT: Log admin override removal
    await auditLogger.logEvent({
      eventType: 'admin_override',
      userId: userId,
      userEmail: session.user.email!,
      action: 'subscription_override_cleared',
      details: { adminUser: session.user.email },
      severity: 'high',
      source: 'admin_api',
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    });
    
    await clearAdminOverride(userId);

    // Get updated subscription info
    const subscription = await getUserSubscription(userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription override cleared',
      subscription,
    });
  } catch (error) {
    console.error('Error clearing subscription override:', error);
    return NextResponse.json(
      { error: 'Failed to clear subscription override' },
      { status: 500 }
    );
  }
}

// GET /api/admin/subscription-override - Get current subscription info
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    
    // Add debugging
    console.log('Session data:', {
      exists: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      name: session?.user?.name
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Ensure user exists in database and get the proper database UUID
    const dbUserId = await ensureUserExists({
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name ?? undefined,
      image: session.user.image ?? undefined
    });
    
    console.log('Database user ID:', dbUserId);

    const subscription = await getUserSubscription(dbUserId);
    
    console.log('Subscription lookup result:', subscription ? 'Found' : 'Not found');
    
    if (!subscription) {
      return NextResponse.json({ 
        error: 'Failed to get subscription info after creating user',
        debug: {
          sessionUserId: session.user.id,
          dbUserId: dbUserId,
          userEmail: session.user.email
        }
      }, { status: 500 });
    }

    const limits = SUBSCRIPTION_LIMITS[subscription.tier];

    return NextResponse.json({
      subscription,
      limits: {
        videosPerMonth: limits.videosPerMonth === -1 ? 'unlimited' : limits.videosPerMonth,
        aiQuestionsPerMonth: limits.aiQuestionsPerMonth === -1 ? 'unlimited' : limits.aiQuestionsPerMonth,
        storageGB: limits.storageGB,
        availableFormats: limits.availableFormats,
        exportFormats: limits.exportFormats,
        processingSpeed: limits.processingSpeed,
        watermarkOnExports: limits.watermarkOnExports,
      },
      adminOverride: subscription.adminOverride,
      isTestAccount: !!subscription.adminOverride,
    });
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription info' },
      { status: 500 }
    );
  }
}