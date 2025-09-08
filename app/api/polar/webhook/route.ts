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
import { updateUserSubscription } from "@/lib/subscription/service";
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from "@/lib/subscription/config";

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
        
      case 'order.paid':
        await handleOrderPaid(event.data);
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
    console.log('✅ Polar checkout succeeded:', checkout.id);
    
    // Extract user info from checkout metadata or custom fields
    const userId = checkout.metadata?.userId;
    let tier = checkout.metadata?.tier;
    
    if (!userId) {
      console.error('❌ Missing user ID in checkout metadata');
      return;
    }

    if (!tier) {
      console.error('❌ Missing tier in checkout metadata');
      return;
    }

    // 🔒 Validate and normalize tier
    if (!['basic', 'pro'].includes(tier)) {
      console.error('❌ Invalid subscription tier in checkout:', tier);
      return;
    }

    tier = tier as SubscriptionTier;
    console.log(`💳 Processing checkout for user ${userId} with tier: ${tier}`);

    // Use centralized subscription service
    await updateUserSubscription(userId, {
      tier,
      status: 'active',
      // Don't set these here - Polar doesn't use recurring subscriptions via checkout
      // These will be set when the actual subscription is created
    });

    console.log(`✅ Checkout processed successfully - user ${userId} upgraded to ${tier}`);
  }
}

async function handleSubscriptionCreated(subscription: any) {
  console.log('✅ Polar subscription created:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  let tier = subscription.metadata?.tier;
  
  if (!userId) {
    console.error('❌ Missing user ID in subscription metadata');
    return;
  }

  if (!tier) {
    console.error('❌ Missing tier in subscription metadata');
    return;
  }

  // 🔒 Validate and normalize tier
  if (!['basic', 'pro'].includes(tier)) {
    console.error('❌ Invalid subscription tier in subscription:', tier);
    return;
  }

  tier = tier as SubscriptionTier;
  console.log(`🔄 Creating subscription for user ${userId} with tier: ${tier}`);

  // Use centralized subscription service
  await updateUserSubscription(userId, {
    tier,
    status: 'active',
    // Polar-specific fields would need to be added to updateUserSubscription
    // For now, we'll update them separately
  });

  // Update Polar-specific fields directly
  await db
    .update(users)
    .set({
      polarSubscriptionId: subscription.id,
      polarCustomerId: subscription.customer_id,
      paymentProvider: 'polar',
      subscriptionCurrentPeriodStart: new Date(subscription.current_period_start),
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.log(`✅ Subscription created successfully - user ${userId} has ${tier} tier`);
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('🔄 Polar subscription updated:', subscription.id);
  
  // Find user by polar subscription ID
  const dbUsers = await db
    .select()
    .from(users)
    .where(eq(users.polarSubscriptionId, subscription.id))
    .limit(1);

  if (dbUsers.length === 0) {
    console.error('❌ User not found for subscription:', subscription.id);
    return;
  }

  const user = dbUsers[0];
  console.log(`🔄 Updating subscription for user ${user.id} - Status: ${subscription.status}`);
  
  // Map Polar status to our status
  const statusMapping: Record<string, 'active' | 'canceled' | 'past_due' | 'incomplete'> = {
    'active': 'active',
    'canceled': 'canceled', 
    'cancelled': 'canceled',
    'past_due': 'past_due',
    'incomplete': 'incomplete',
    'trialing': 'active',
  };
  
  const status = statusMapping[subscription.status] || 'incomplete';

  // Use centralized subscription service for consistency
  await updateUserSubscription(user.id, {
    status,
    // Don't change tier unless explicitly provided
    currentPeriodStart: new Date(subscription.current_period_start),
    currentPeriodEnd: new Date(subscription.current_period_end),
  });

  console.log(`✅ Subscription updated successfully - user ${user.id} status: ${status}`);
}

async function handleSubscriptionCanceled(subscription: any) {
  console.log('❌ Polar subscription canceled:', subscription.id);
  
  // Find user by polar subscription ID
  const dbUsers = await db
    .select()
    .from(users)
    .where(eq(users.polarSubscriptionId, subscription.id))
    .limit(1);

  if (dbUsers.length === 0) {
    console.error('❌ User not found for subscription:', subscription.id);
    return;
  }

  const user = dbUsers[0];
  console.log(`🔄 Canceling subscription for user ${user.id} - reverting to free tier`);

  // Check for admin override - don't downgrade if user has active admin override
  const hasActiveAdminOverride = user.adminOverrideTier && 
    (!user.adminOverrideExpires || user.adminOverrideExpires > new Date());

  if (hasActiveAdminOverride) {
    console.log(`⚠️ User ${user.id} has active admin override - preserving tier but updating status`);
  }

  // Use centralized subscription service
  await updateUserSubscription(user.id, {
    tier: hasActiveAdminOverride ? undefined : 'free', // Don't override admin tier
    status: 'canceled',
    currentPeriodStart: new Date(subscription.current_period_start),
    currentPeriodEnd: new Date(subscription.current_period_end),
  });

  console.log(`✅ Subscription canceled successfully - user ${user.id} reverted to ${hasActiveAdminOverride ? 'admin override tier' : 'free tier'}`);
}

async function handleOrderPaid(order: any) {
  console.log('Order paid:', order.id);
  
  // Extract key data from the order
  const customerEmail = order.customer?.email || order.user?.email;
  const productId = order.product_id;
  const subscriptionId = order.subscription_id;
  
  if (!customerEmail) {
    console.error('❌ No customer email in order.paid webhook');
    return;
  }
  
  console.log(`Processing paid order for ${customerEmail}, product: ${productId}`);
  
  // Find user by email
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, customerEmail))
    .limit(1);

  if (!existingUsers.length) {
    console.error(`❌ User not found with email: ${customerEmail}`);
    return;
  }

  const user = existingUsers[0];
  
  // Determine subscription tier based on product ID
  let tier: SubscriptionTier = 'free';
  const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
  const basicProductId = process.env.POLAR_BASIC_PRODUCT_ID;
  
  if (productId === proProductId) {
    tier = 'pro';
  } else if (productId === basicProductId) {
    tier = 'basic';
  } else {
    console.warn(`⚠️ Unknown product ID: ${productId}, defaulting to free tier`);
  }

  // Don't override admin override tiers
  const hasActiveAdminOverride = user.adminOverrideTier && 
    (!user.adminOverrideExpires || user.adminOverrideExpires > new Date());

  if (hasActiveAdminOverride) {
    console.log(`ℹ️ User ${user.id} has active admin override (${user.adminOverrideTier}), skipping tier update`);
  }

  // Update user subscription directly (includes Polar-specific fields)
  const updateData: any = {
    subscriptionStatus: 'active',
    currentPeriodStart: order.subscription?.current_period_start ? new Date(order.subscription.current_period_start) : new Date(),
    currentPeriodEnd: order.subscription?.current_period_end ? new Date(order.subscription.current_period_end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    polarCustomerId: order.customer_id,
    polarSubscriptionId: subscriptionId,
    paymentProvider: 'polar',
    updatedAt: new Date(),
  };

  // Only update tier if no active admin override
  if (!hasActiveAdminOverride) {
    updateData.subscriptionTier = tier;
  }

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, user.id));

  // Also use centralized service to sync limits and monthly usage
  await updateUserSubscription(user.id, {
    tier: hasActiveAdminOverride ? undefined : tier,
    status: 'active',
    currentPeriodStart: updateData.currentPeriodStart,
    currentPeriodEnd: updateData.currentPeriodEnd,
  });

  console.log(`✅ Order processed successfully - user ${user.id} (${customerEmail}) upgraded to ${hasActiveAdminOverride ? 'admin override tier' : tier}`);
}

// Note: Now using centralized updateUserSubscription from @/lib/subscription/service
// This ensures consistency across all subscription updates and proper limit enforcement