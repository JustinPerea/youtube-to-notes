import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateUserSubscription } from '@/lib/subscription/service';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to manually downgrade a user back to free
 * GET /api/debug/downgrade-user?email=justinmperea@gmail.com
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    console.log(`🔄 Manual downgrade for email: ${email}`);

    // 1. Check if user exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existingUsers.length) {
      return NextResponse.json({ 
        error: 'User not found',
        email
      }, { status: 404 });
    }

    const user = existingUsers[0];
    console.log(`👤 Found user: ${user.id}, current tier: ${user.subscriptionTier}`);

    // 2. Check for admin override (don't downgrade if active override)
    const hasActiveAdminOverride = user.adminOverrideTier && 
      (!user.adminOverrideExpires || user.adminOverrideExpires > new Date());

    if (hasActiveAdminOverride) {
      return NextResponse.json({
        success: false,
        message: 'User has active admin override - not downgrading',
        user: {
          id: user.id,
          email: user.email,
          tier: user.subscriptionTier,
          adminOverride: user.adminOverrideTier,
          adminExpires: user.adminOverrideExpires
        }
      });
    }

    // 3. Downgrade user to free
    console.log(`⬇️ Downgrading user ${user.id} to free tier`);
    
    await db
      .update(users)
      .set({
        subscriptionTier: 'free',
        subscriptionStatus: 'canceled',
        // Keep Polar data for reference but mark as canceled
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Also use centralized service
    await updateUserSubscription(user.id, {
      tier: 'free',
      status: 'canceled',
    });

    // 4. Verify the downgrade
    const verifyUser = await db
      .select({ 
        subscriptionTier: users.subscriptionTier, 
        subscriptionStatus: users.subscriptionStatus,
        paymentProvider: users.paymentProvider
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    console.log(`✅ User downgraded successfully to: ${verifyUser[0]?.subscriptionTier}`);

    return NextResponse.json({
      success: true,
      message: 'User successfully downgraded to free tier',
      user: {
        id: user.id,
        email: user.email,
        tier: verifyUser[0]?.subscriptionTier,
        status: verifyUser[0]?.subscriptionStatus,
        provider: verifyUser[0]?.paymentProvider
      }
    });

  } catch (error) {
    console.error('Manual downgrade error:', error);
    return NextResponse.json(
      { 
        error: 'Downgrade failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}