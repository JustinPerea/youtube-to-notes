import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionWithDatabase } from '../../../../lib/auth-utils';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Emergency admin endpoint to forcefully clear admin overrides
 * POST /api/admin/clear-override - Clear all admin overrides for current user
 */

export async function POST(req: NextRequest) {
  try {
    const { user } = await getApiSessionWithDatabase(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Admin check - more permissive for emergency fixing
    const isAdmin = user.email?.includes('@') && (
      user.email === 'admin@example.com' || 
      user.email?.endsWith('@gmail.com') || // Allow gmail for dev testing
      process.env.NODE_ENV === 'development'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('🔧 Emergency clear admin override for user:', user.id);

    // Direct database update to clear admin override
    const result = await db
      .update(users)
      .set({
        adminOverrideTier: null,
        adminOverrideExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ 
        id: users.id, 
        subscriptionTier: users.subscriptionTier,
        adminOverrideTier: users.adminOverrideTier 
      });

    if (!result.length) {
      return NextResponse.json({
        error: 'User not found or update failed'
      }, { status: 404 });
    }

    const updatedUser = result[0];

    console.log('✅ Admin override cleared:', {
      userId: user.id,
      currentTier: updatedUser.subscriptionTier,
      overrideCleared: updatedUser.adminOverrideTier === null
    });

    return NextResponse.json({
      success: true,
      message: 'Admin override forcefully cleared',
      userId: user.id,
      currentSubscriptionTier: updatedUser.subscriptionTier,
      adminOverrideCleared: true
    });

  } catch (error) {
    console.error('Error in emergency clear override:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear override',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : 
          undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await getApiSessionWithDatabase(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get current user state
    const currentUser = await db
      .select({
        id: users.id,
        email: users.email,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
        adminOverrideTier: users.adminOverrideTier,
        adminOverrideExpires: users.adminOverrideExpires,
        polarSubscriptionId: users.polarSubscriptionId,
        paymentProvider: users.paymentProvider,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = currentUser[0];
    const hasActiveOverride = userData.adminOverrideTier && 
      (!userData.adminOverrideExpires || userData.adminOverrideExpires > new Date());

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        subscriptionTier: userData.subscriptionTier,
        subscriptionStatus: userData.subscriptionStatus,
        paymentProvider: userData.paymentProvider,
        polarSubscriptionId: userData.polarSubscriptionId,
      },
      adminOverride: {
        tier: userData.adminOverrideTier,
        expires: userData.adminOverrideExpires,
        isActive: hasActiveOverride,
      },
      canClearOverride: hasActiveOverride,
    });

  } catch (error) {
    console.error('Error getting override status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}