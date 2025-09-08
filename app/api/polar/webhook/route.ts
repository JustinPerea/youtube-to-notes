/**
 * Polar Webhook Handler
 * Handles subscription events from Polar.sh
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { users, userMonthlyUsage } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from 'crypto';

// Subscription tier limits
const SUBSCRIPTION_LIMITS = {
  basic: {
    monthlyVideoLimit: 50,
    aiQuestionsLimit: 100,
    storageLimitMb: 1000
  },
  pro: {
    monthlyVideoLimit: -1, // unlimited
    aiQuestionsLimit: -1,  // unlimited
    storageLimitMb: 10000
  }
} as const;

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  );
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('polar-signature');
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 400 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    console.log('Polar webhook received:', event.type);

    switch (event.type) {
      case 'checkout.created':
        await handleCheckoutCreated(event.data);
        break;
        
      case 'checkout.updated':
        await handleCheckoutUpdated(event.data);
        break;
        
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
        
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
        
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Polar webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCreated(checkout: any) {
  console.log('Checkout created:', checkout.id);
  // Log checkout creation, but don't update user until payment succeeds
}

async function handleCheckoutUpdated(checkout: any) {
  if (checkout.status === 'succeeded') {
    console.log('Checkout succeeded:', checkout.id);
    
    // Extract user info from checkout metadata or custom fields
    const userId = checkout.metadata?.userId;
    const tier = checkout.metadata?.tier;
    
    if (!userId || !tier) {
      console.error('Missing user ID or tier in checkout metadata');
      return;
    }

    await updateUserSubscription(userId, tier, 'polar', {
      polarCheckoutId: checkout.id,
      polarCustomerId: checkout.customer_id,
      amount: checkout.amount,
      currency: checkout.currency
    });
  }
}

async function handleSubscriptionCreated(subscription: any) {
  console.log('Subscription created:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  const tier = subscription.metadata?.tier;
  
  if (!userId || !tier) {
    console.error('Missing user ID or tier in subscription metadata');
    return;
  }

  await updateUserSubscription(userId, tier, 'polar', {
    polarSubscriptionId: subscription.id,
    polarCustomerId: subscription.customer_id,
    currentPeriodStart: new Date(subscription.current_period_start),
    currentPeriodEnd: new Date(subscription.current_period_end),
    status: subscription.status
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Subscription updated:', subscription.id);
  
  // Find user by polar subscription ID
  const dbUsers = await db
    .select()
    .from(users)
    .where(eq(users.polarSubscriptionId, subscription.id))
    .limit(1);

  if (dbUsers.length === 0) {
    console.error('User not found for subscription:', subscription.id);
    return;
  }

  const user = dbUsers[0];
  
  await db
    .update(users)
    .set({
      subscriptionStatus: subscription.status === 'active' ? 'active' : 'canceled',
      subscriptionCurrentPeriodStart: new Date(subscription.current_period_start),
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
}

async function handleSubscriptionCanceled(subscription: any) {
  console.log('Subscription canceled:', subscription.id);
  
  // Find user by polar subscription ID
  const dbUsers = await db
    .select()
    .from(users)
    .where(eq(users.polarSubscriptionId, subscription.id))
    .limit(1);

  if (dbUsers.length === 0) {
    console.error('User not found for subscription:', subscription.id);
    return;
  }

  const user = dbUsers[0];
  
  await db
    .update(users)
    .set({
      subscriptionStatus: 'canceled',
      subscriptionTier: 'free',
      monthlyVideoLimit: 5,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
}

async function updateUserSubscription(
  userId: string, 
  tier: string, 
  provider: 'polar' | 'stripe',
  details: any
) {
  try {
    const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];
    
    if (!limits) {
      console.error('Invalid subscription tier:', tier);
      return;
    }

    // Update user subscription
    await db
      .update(users)
      .set({
        subscriptionTier: tier as 'basic' | 'pro',
        subscriptionStatus: 'active',
        monthlyVideoLimit: limits.monthlyVideoLimit,
        storageLimitMb: limits.storageLimitMb,
        // Polar-specific fields
        ...(provider === 'polar' && {
          polarCustomerId: details.polarCustomerId,
          polarSubscriptionId: details.polarSubscriptionId,
          subscriptionCurrentPeriodStart: details.currentPeriodStart,
          subscriptionCurrentPeriodEnd: details.currentPeriodEnd,
        }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Create/update monthly usage record
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    await db
      .insert(userMonthlyUsage)
      .values({
        userId,
        monthYear: currentMonth,
        videosLimit: limits.monthlyVideoLimit,
        aiQuestionsLimit: limits.aiQuestionsLimit,
        storageLimitMb: limits.storageLimitMb,
        subscriptionTier: tier as 'basic' | 'pro',
      })
      .onConflictDoUpdate({
        target: [userMonthlyUsage.userId, userMonthlyUsage.monthYear],
        set: {
          videosLimit: limits.monthlyVideoLimit,
          aiQuestionsLimit: limits.aiQuestionsLimit,
          storageLimitMb: limits.storageLimitMb,
          subscriptionTier: tier as 'basic' | 'pro',
          updatedAt: new Date(),
        }
      });

    console.log(`✅ User ${userId} subscription updated to ${tier} via ${provider}`);

  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}