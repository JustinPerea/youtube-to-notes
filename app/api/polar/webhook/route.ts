/**
 * Polar Webhook Handler
 * Handles subscription events from Polar.sh
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { users, userMonthlyUsage } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from 'crypto';
import { auditLogger } from "@/lib/audit/logger";

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
  if (!signature || !secret || !payload) {
    console.error('❌ Missing required parameters for webhook verification');
    return false;
  }
  
  // Validate signature format
  if (!signature.startsWith('sha256=')) {
    console.error('❌ Invalid signature format - must start with sha256=');
    return false;
  }
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    const receivedSignature = signature.replace('sha256=', '');
    
    // Use timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
    
    if (!isValid) {
      console.error('❌ Webhook signature verification failed');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error during signature verification:', error);
    return false;
  }
}

// 🔒 SECURITY: Rate limiting for webhook endpoints
const webhookAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkWebhookRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const maxAttempts = 100; // Max 100 webhooks per minute per IP
  
  const attempts = webhookAttempts.get(clientIp) || { count: 0, lastAttempt: 0 };
  
  // Reset counter if window expired
  if (now - attempts.lastAttempt > windowMs) {
    attempts.count = 0;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  webhookAttempts.set(clientIp, attempts);
  
  return attempts.count <= maxAttempts;
}

export async function POST(req: NextRequest) {
  const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    // 🔒 SECURITY: Rate limiting
    if (!checkWebhookRateLimit(clientIp)) {
      console.error(`❌ Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    const payload = await req.text();
    const signature = req.headers.get('polar-signature');
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    // 🔒 SECURITY: Enhanced validation
    if (!signature || !webhookSecret) {
      console.error('❌ Missing webhook signature or secret');
      
      // 🔒 AUDIT: Log security violation
      await auditLogger.logSecurityViolation(
        'unauthorized_access',
        { reason: 'missing_webhook_credentials', endpoint: 'polar_webhook' },
        clientIp
      );
      
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 400 });
    }
    
    // Validate payload size (prevent DoS attacks)
    if (payload.length > 1024 * 1024) { // 1MB limit
      console.error(`❌ Webhook payload too large: ${payload.length} bytes`);
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    // 🔒 SECURITY: Verify webhook signature with enhanced validation
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error(`❌ Invalid webhook signature from IP: ${clientIp}`);
      
      // 🔒 AUDIT: Log security violation
      await auditLogger.logSecurityViolation(
        'invalid_signature',
        { provider: 'polar', endpoint: 'webhook', signatureProvided: !!signature },
        clientIp
      );
      
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 🔒 SECURITY: Safe JSON parsing with validation
    let event: any;
    try {
      event = JSON.parse(payload);
      
      // Validate required event structure
      if (!event.type || typeof event.type !== 'string') {
        console.error('❌ Invalid webhook event structure - missing or invalid type');
        return NextResponse.json({ error: 'Invalid event structure' }, { status: 400 });
      }
      
      // 🔒 AUDIT: Log webhook reception
      await auditLogger.logWebhook(
        'received',
        'polar',
        event.type,
        { eventId: event.id || 'unknown' },
        clientIp
      );
      
      // Log securely (don't log sensitive data)
      console.log('✅ Polar webhook received:', event.type);
      
    } catch (parseError) {
      console.error('❌ Failed to parse webhook payload:', parseError);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

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
    // 🔒 SECURITY: Validate inputs
    if (!userId || typeof userId !== 'string' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('❌ Invalid user ID format:', userId);
      return;
    }
    
    if (!['basic', 'pro'].includes(tier)) {
      console.error('❌ Invalid subscription tier:', tier);
      return;
    }
    
    if (!['polar', 'stripe'].includes(provider)) {
      console.error('❌ Invalid provider:', provider);
      return;
    }
    
    const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];
    
    if (!limits) {
      console.error('❌ Invalid subscription tier limits:', tier);
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

    // 🔒 SECURITY: Audit log for subscription changes
    console.log(`✅ AUDIT: User subscription updated`, {
      userId: userId.substring(0, 8) + '***', // Partial ID for privacy
      tier,
      provider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}