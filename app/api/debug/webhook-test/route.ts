import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateUserSubscription } from '@/lib/subscription/service';
import { type SubscriptionTier } from '@/lib/subscription/config';
import { isDebugEnabled } from '@/lib/security/debug-gate';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to manually test webhook processing logic
 * GET /api/debug/webhook-test?email=max65perea@gmail.com
 */
export async function GET(req: NextRequest) {
  if (!isDebugEnabled()) {
    return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const action = searchParams.get('action') || 'upgrade'; // 'upgrade' or 'cancel'
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    console.log(`🔍 Debug webhook test for email: ${email}`);

    // 1. Check if user exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existingUsers.length) {
      return NextResponse.json({ 
        error: 'User not found',
        email,
        step: 'user_lookup_failed'
      }, { status: 404 });
    }

    const user = existingUsers[0];
    console.log(`👤 Found user: ${user.id}`);

    // 2. Check environment variables
    const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
    const basicProductId = process.env.POLAR_BASIC_PRODUCT_ID;
    
    console.log(`🔧 Environment variables:`);
    console.log(`📦 POLAR_PRO_PRODUCT_ID: ${proProductId}`);
    console.log(`📦 POLAR_BASIC_PRODUCT_ID: ${basicProductId}`);

    // 3. Simulate webhook product ID matching
    const webhookProductId = '89b59bcb-00bd-4ec7-b258-105bcacae3ba'; // From your webhook
    let tier: SubscriptionTier = 'free';
    
    if (webhookProductId === proProductId) {
      tier = 'pro';
    } else if (webhookProductId === basicProductId) {
      tier = 'basic';
    }

    console.log(`🎯 Tier determination:`);
    console.log(`📦 Webhook Product ID: ${webhookProductId}`);
    console.log(`📦 Environment Pro ID: ${proProductId}`);
    console.log(`🔍 Match: ${webhookProductId === proProductId}`);
    console.log(`🎯 Assigned Tier: ${tier}`);

    // 4. Check for admin override
    const hasActiveAdminOverride = user.adminOverrideTier && 
      (!user.adminOverrideExpires || user.adminOverrideExpires > new Date());

    console.log(`🔒 Admin override check:`);
    console.log(`🔒 Admin Override Tier: ${user.adminOverrideTier}`);
    console.log(`🔒 Admin Override Expires: ${user.adminOverrideExpires}`);
    console.log(`🔒 Has Active Override: ${hasActiveAdminOverride}`);

    // 5. Manually update the user to Pro (for testing)
    if (tier === 'pro' && !hasActiveAdminOverride) {
      console.log(`✅ Manually updating user to Pro tier`);
      
      // Update user subscription directly
      await db
        .update(users)
        .set({
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
          paymentProvider: 'polar',
          polarCustomerId: 'c6078ec4-4bcc-411b-889f-251f850c63e5', // From webhook
          polarSubscriptionId: '1d31ceea-5cdd-4867-857c-ecd5ebd00bd0', // From webhook
          currentPeriodStart: new Date('2025-09-08T17:44:04Z'),
          currentPeriodEnd: new Date('2025-10-08T17:44:04Z'),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Also use centralized service
      await updateUserSubscription(user.id, {
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date('2025-09-08T17:44:04Z'),
        currentPeriodEnd: new Date('2025-10-08T17:44:04Z'),
      });

      return NextResponse.json({
        success: true,
        message: 'User manually upgraded to Pro',
        user: {
          id: user.id,
          email: user.email,
          tier: 'pro',
          status: 'active',
          provider: 'polar'
        },
        debug: {
          productIdMatch: webhookProductId === proProductId,
          hasAdminOverride: hasActiveAdminOverride,
          proProductId,
          webhookProductId
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: hasActiveAdminOverride ? 'User has admin override - skipping update' : 'Product ID mismatch or tier not Pro',
      user: {
        id: user.id,
        email: user.email,
        currentTier: user.subscriptionTier,
        status: user.subscriptionStatus,
        provider: user.paymentProvider
      },
      debug: {
        productIdMatch: webhookProductId === proProductId,
        hasAdminOverride: hasActiveAdminOverride,
        calculatedTier: tier,
        proProductId,
        webhookProductId
      }
    });

  } catch (error) {
    console.error('Debug webhook test error:', error);
    return NextResponse.json(
      { 
        error: 'Debug test failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
