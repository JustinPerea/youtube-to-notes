import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isDebugEnabled } from '@/lib/security/debug-gate';
import { createHmac } from 'crypto';
import { POST as PolarWebhookPOST } from '@/app/api/polar/webhook/route';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to simulate Polar cancellation scenarios against the webhook.
 *
 * GET /api/debug/polar-cancel-simulate?email=you@example.com&mode=scheduled|final&event=canceled|updated
 * - mode=scheduled: cancel_at_period_end=true, current_period_end in the future
 * - mode=final: current_period_end in the past (period ended)
 * - event=canceled (default) or updated
 */
export async function GET(req: NextRequest) {
  if (!isDebugEnabled()) {
    return new NextResponse(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const mode = (searchParams.get('mode') || 'scheduled').toLowerCase(); // 'scheduled' | 'final'
    const eventType = (searchParams.get('event') || 'canceled').toLowerCase(); // 'canceled' | 'updated'

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Look up user
    const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!found.length) {
      return NextResponse.json({ error: 'User not found', email }, { status: 404 });
    }
    const user = found[0];

    // Ensure user has a Polar subscription ID for webhook linkage
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

    // Compose simulated subscription payload
    const now = Date.now();
    const start = new Date(now - 5 * 60 * 1000); // 5 minutes ago
    const endFuture = new Date(now + 60 * 60 * 1000); // 1 hour in future
    const endPast = new Date(now - 60 * 1000); // 1 minute in past

    const isScheduled = mode === 'scheduled';
    const cancel_at_period_end = isScheduled;
    const current_period_end = (isScheduled ? endFuture : endPast).toISOString();
    const current_period_start = start.toISOString();

    const subscription = {
      id: polarSubscriptionId,
      customer_id: polarCustomerId,
      cancel_at_period_end,
      current_period_start,
      current_period_end,
      status: 'canceled',
      customer: { email: user.email },
      user: { email: user.email },
    } as any;

    const webhookEvent = {
      type: eventType === 'updated' ? 'subscription.updated' : 'subscription.canceled',
      data: subscription,
    };

    // Call the webhook handler directly to avoid external protection
    // Compute a valid Polar signature for the payload
    const rawBody = JSON.stringify(webhookEvent);
    const secret = process.env.POLAR_WEBHOOK_SECRET || '';
    const signature = 'sha256=' + createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');

    const internalReq = new Request('http://internal/api/polar/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'polar-signature': signature },
      body: rawBody,
    });
    const res = await PolarWebhookPOST(internalReq as any);

    // Read body once to avoid "Body already read" errors
    const raw = await res.text();
    let webhookResponse: any = null;
    try {
      webhookResponse = JSON.parse(raw);
    } catch (_) {
      webhookResponse = { raw };
    }

    // Reload user after webhook processing
    const after = await db
      .select({
        id: users.id,
        email: users.email,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionCancelAtPeriodEnd: users.subscriptionCancelAtPeriodEnd,
        subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return NextResponse.json({
      ok: res.ok,
      eventSent: webhookEvent.type,
      mode,
      webhookResponse,
      userBefore: {
        id: user.id,
        email: user.email,
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
        currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      },
      userAfter: after[0],
      notes: {
        scheduledMeans: 'Tier unchanged; only flags/dates updated',
        finalMeans: 'Period ended; tier downgrade only if POLAR_DOWNGRADE_ON_CANCEL=true and no admin override',
      },
    });
  } catch (error) {
    console.error('polar-cancel-simulate error:', error);
    return NextResponse.json(
      {
        error: 'Simulation failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
