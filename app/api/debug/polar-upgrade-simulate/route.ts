import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isDebugEnabled } from '@/lib/security/debug-gate';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to simulate Polar upgrade/activation scenarios against the webhook.
 *
 * GET /api/debug/polar-upgrade-simulate?email=you@example.com&tier=pro|basic&event=active|updated|order_paid
 */
export async function GET(req: NextRequest) {
  if (!isDebugEnabled()) {
    return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const tier = (searchParams.get('tier') || 'pro').toLowerCase(); // pro|basic
    const eventParam = (searchParams.get('event') || 'active').toLowerCase(); // active|updated|order_paid

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!found.length) {
      return NextResponse.json({ error: 'User not found', email }, { status: 404 });
    }
    const user = found[0];

    // Resolve product ID
    const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
    const basicProductId = process.env.POLAR_BASIC_PRODUCT_ID;
    const productId = tier === 'basic' ? basicProductId : proProductId;
    if (!productId) {
      return NextResponse.json({ error: 'Missing product ID env var for selected tier' }, { status: 500 });
    }

    // Ensure linkage fields
    let polarSubscriptionId = user.polarSubscriptionId;
    let polarCustomerId = user.polarCustomerId;
    const updates: any = {};
    if (!polarSubscriptionId) {
      polarSubscriptionId = `test-sub-${user.id}`;
      updates.polarSubscriptionId = polarSubscriptionId;
    }
    if (!polarCustomerId) {
      polarCustomerId = `test-cust-${user.id.substring(0, 8)}`;
      updates.polarCustomerId = polarCustomerId;
    }
    if (Object.keys(updates).length) {
      await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, user.id));
    }

    // Compose subscription/order payload
    const now = Date.now();
    const start = new Date(now - 5 * 60 * 1000).toISOString();
    const end = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();

    const subscription = {
      id: polarSubscriptionId,
      customer_id: polarCustomerId,
      current_period_start: start,
      current_period_end: end,
      status: 'active',
      product_id: productId,
      customer: { email: user.email },
      user: { email: user.email },
    } as any;

    const order = {
      id: `test-order-${user.id.substring(0, 8)}`,
      product_id: productId,
      subscription_id: polarSubscriptionId,
      customer_id: polarCustomerId,
      subscription: { current_period_start: start, current_period_end: end },
      customer: { email: user.email },
      user: { email: user.email },
    } as any;

    const type = eventParam === 'updated' ? 'subscription.updated' : eventParam === 'order_paid' ? 'order.paid' : 'subscription.active';
    const data = type === 'order.paid' ? order : subscription;

    const webhookEvent = { type, data };

    // Call the webhook
    const webhookUrl = new URL('/api/polar/webhook', req.url).toString();
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookEvent),
    });

    let webhookResponse: any = null;
    try {
      webhookResponse = await res.json();
    } catch (_) {
      webhookResponse = { raw: await res.text() };
    }

    // Reload
    const after = await db
      .select({
        id: users.id,
        email: users.email,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return NextResponse.json({
      ok: res.ok,
      eventSent: type,
      tierSelected: tier,
      webhookResponse,
      userBefore: {
        id: user.id,
        email: user.email,
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
      },
      userAfter: after[0],
    });
  } catch (error) {
    console.error('polar-upgrade-simulate error:', error);
    return NextResponse.json({ error: 'Simulation failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

