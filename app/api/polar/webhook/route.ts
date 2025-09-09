/**
 * Polar Webhook Handler
 * Handles subscription events from Polar.sh
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { users, userMonthlyUsage } from "@/lib/db/schema";
import { eq, sql, or } from "drizzle-orm";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { auditLogger } from "@/lib/audit/logger";
import { updateUserSubscription } from "@/lib/subscription/service";
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from "@/lib/subscription/config";

// ⚡ OPTIMIZED: Single-query user lookup with prioritized OR conditions  
async function findUserForWebhook(webhookData: any): Promise<any | null> {
  console.log('🔍 Starting optimized single-query user lookup...');
  
  // Build OR conditions based on available data
  const conditions = [];
  const lookupInfo = {
    externalId: webhookData.metadata?.userId,
    customerEmail: webhookData.customer?.email,
    userEmail: webhookData.user?.email
  };
  
  console.log('🔍 Lookup data:', lookupInfo);
  
  // Priority 1: External ID (most reliable)
  if (lookupInfo.externalId) {
    conditions.push(eq(users.id, lookupInfo.externalId));
  }
  
  // Priority 2: Exact email matches
  if (lookupInfo.customerEmail) {
    conditions.push(eq(users.email, lookupInfo.customerEmail));
  }
  if (lookupInfo.userEmail && lookupInfo.userEmail !== lookupInfo.customerEmail) {
    conditions.push(eq(users.email, lookupInfo.userEmail));
  }
  
  // Priority 3: Case-insensitive email matches
  if (lookupInfo.customerEmail) {
    conditions.push(sql`LOWER(${users.email}) = LOWER(${lookupInfo.customerEmail})`);
  }
  if (lookupInfo.userEmail && lookupInfo.userEmail !== lookupInfo.customerEmail) {
    conditions.push(sql`LOWER(${users.email}) = LOWER(${lookupInfo.userEmail})`);
  }
  
  if (conditions.length === 0) {
    console.error('❌ No lookup conditions available');
    return null;
  }
  
  try {
    console.log(`🔍 Executing single query with ${conditions.length} OR conditions`);
    
    // ⚡ SINGLE OPTIMIZED QUERY: Replaces 5 sequential queries
    const result = await db
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1); // Only need first match due to prioritized ordering
    
    if (result && result.length > 0) {
      const user = result[0];
      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
      
      // Log which condition likely matched (for debugging)
      if (lookupInfo.externalId === user.id) {
        console.log(`🎯 Match type: External ID`);
      } else if (user.email === lookupInfo.customerEmail) {
        console.log(`🎯 Match type: Customer email (exact)`);
      } else if (user.email === lookupInfo.userEmail) {
        console.log(`🎯 Match type: User email (exact)`);
      } else {
        console.log(`🎯 Match type: Email (case-insensitive)`);
      }
      
      return user;
    }
    
    console.error('❌ User not found with optimized lookup');
    return null;
    
  } catch (error) {
    console.error('💥 Error in optimized user lookup:', error);
    
    // Log for manual review
    console.error('❌ User lookup failed. Webhook data:', {
      customerEmail: lookupInfo.customerEmail,
      userEmail: lookupInfo.userEmail,
      externalId: lookupInfo.externalId,
      customerId: webhookData.customer?.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return null;
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
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    // 🔒 SECURITY: Enhanced validation
    if (!webhookSecret) {
      console.error('❌ Missing webhook secret');
      
      // 🔒 AUDIT: Log security violation
      await auditLogger.logSecurityViolation(
        'unauthorized_access',
        { reason: 'missing_webhook_secret', endpoint: 'polar_webhook' },
        clientIp
      );
      
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 400 });
    }

    // 🔴 CRITICAL: Environment variable validation
    // Without these, ALL paid subscriptions will default to free tier!
    const requiredEnvVars = {
      POLAR_WEBHOOK_SECRET: webhookSecret,
      POLAR_PRO_PRODUCT_ID: process.env.POLAR_PRO_PRODUCT_ID,
      POLAR_BASIC_PRODUCT_ID: process.env.POLAR_BASIC_PRODUCT_ID,
    };

    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value || value.trim() === '') {
        console.error(`❌ CRITICAL: Missing required environment variable: ${key}`);
        
        // 🔒 AUDIT: Log configuration violation
        await auditLogger.logSecurityViolation(
          'unauthorized_access',
          { reason: `missing_env_var_${key}`, endpoint: 'polar_webhook' },
          clientIp
        );
        
        return NextResponse.json({ 
          error: 'Webhook configuration error',
          message: 'Required environment variables not configured' 
        }, { status: 500 });
      }
    }

    console.log('✅ Environment variable validation passed');
    
    // Validate payload size (prevent DoS attacks)
    if (payload.length > 1024 * 1024) { // 1MB limit
      console.error(`❌ Webhook payload too large: ${payload.length} bytes`);
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    // 🔒 SECURITY: Use official Polar SDK for webhook validation
    let event: any;
    try {
      // Convert headers to the format expected by Polar SDK
      const headers: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Validate event using Polar SDK
      event = validateEvent(
        Buffer.from(payload, 'utf8'),
        headers,
        webhookSecret
      );
      
      // 🔒 AUDIT: Log webhook reception
      await auditLogger.logWebhook(
        'received',
        'polar',
        event.type,
        { eventId: event.id || 'unknown' },
        clientIp
      );
      
      // Log securely (don't log sensitive data)
      console.log('✅ Polar webhook received and verified:', event.type);
      
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        console.error('❌ Polar webhook signature verification failed:', error.message);
        
        // 🔒 AUDIT: Log security violation
        await auditLogger.logSecurityViolation(
          'invalid_signature',
          { provider: 'polar', endpoint: 'webhook', error: error.message },
          clientIp
        );
        
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      } else {
        console.error('❌ Failed to process webhook payload:', error);
        return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
      }
    }

    switch (event.type) {
      case 'subscription.active':
        console.log('🎯 Processing subscription.active - PRIMARY event for tier upgrades');
        await handleSubscriptionActive(event.data);
        break;
        
      case 'subscription.created':
        console.log('🔄 Processing subscription.created - Initial subscription setup');
        await handleSubscriptionCreated(event.data);
        break;
        
      case 'subscription.updated':
        console.log('🔄 Processing subscription.updated - Subscription changes');
        await handleSubscriptionUpdated(event.data);
        break;
        
      case 'subscription.canceled':
        console.log('❌ Processing subscription.canceled - Tier downgrades');
        await handleSubscriptionCanceled(event.data);
        break;
        
      case 'checkout.created':
        await handleCheckoutCreated(event.data);
        break;
        
      case 'checkout.updated':
        await handleCheckoutUpdated(event.data);
        break;
        
      case 'order.paid':
        console.log('💰 Processing order.paid - Payment confirmation (supplementary)');
        await handleOrderPaid(event.data);
        break;
        
      default:
        console.log(`⚠️ Unhandled webhook event: ${event.type}`);
        console.log('Available data keys:', Object.keys(event.data || {}));
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

// 🎯 PRIMARY HANDLER: subscription.active - This is the correct event for tier upgrades
async function handleSubscriptionActive(subscription: any) {
  console.log('🎯 Subscription activated:', subscription.id);
  
  try {
    // Use enhanced user lookup
    const user = await findUserForWebhook(subscription);
    if (!user) {
      console.error('❌ CRITICAL: User not found for subscription.active webhook');
      console.error('❌ Subscription data:', {
        subscriptionId: subscription.id,
        customerId: subscription.customer_id,
        customerEmail: subscription.customer?.email,
        userEmail: subscription.user?.email,
        productId: subscription.product_id
      });
      
      // 🔄 RETRY LOGIC: This should retry, not succeed
      // User might be created after webhook, email lookup might be case-sensitive, etc.
      throw new Error(`User not found for subscription ${subscription.id}. Customer email: ${subscription.customer?.email || 'unknown'}, User email: ${subscription.user?.email || 'unknown'}`);
    }

    console.log(`👤 Found user: ${user.id} (${user.email})`);

    // Determine subscription tier based on product ID
    let tier: SubscriptionTier = 'free';
    const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
    const basicProductId = process.env.POLAR_BASIC_PRODUCT_ID;
    const productId = subscription.product_id;
    
    console.log(`🔍 Product matching: webhook=${productId}, env_pro=${proProductId}, env_basic=${basicProductId}`);
    
    if (productId === proProductId) {
      tier = 'pro';
    } else if (productId === basicProductId) {
      tier = 'basic';
    } else {
      console.warn(`⚠️ Unknown product ID: ${productId}, defaulting to free tier`);
    }

    console.log(`🎯 Determined tier: ${tier}`);

    // Check for admin override (don't overwrite admin overrides)
    const hasActiveAdminOverride = user.adminOverrideTier && 
      (!user.adminOverrideExpires || user.adminOverrideExpires > new Date());

    if (hasActiveAdminOverride) {
      console.log(`ℹ️ User ${user.id} has active admin override (${user.adminOverrideTier}), skipping tier update`);
      
      // 🔄 TRANSACTION: Wrap admin override update for consistency
      await db.transaction(async (tx: any) => {
        // Still update Polar-specific fields
        await tx.update(users)
          .set({
            polarSubscriptionId: subscription.id,
            polarCustomerId: subscription.customer_id,
            subscriptionStatus: 'active',
            subscriptionCurrentPeriodStart: new Date(subscription.current_period_start),
            subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end),
            paymentProvider: 'polar',
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        
        console.log(`💾 Admin override: Updated Polar-specific fields in transaction`);
      });
      
      console.log(`✅ Subscription activated with admin override preserved`);
      return;
    }

    // 🔄 TRANSACTION: Update user subscription with full consistency
    console.log(`💾 Updating user ${user.id} to ${tier} tier...`);
    
    await db.transaction(async (tx: any) => {
      // Update user with new tier and Polar data
      await tx.update(users)
        .set({
          subscriptionTier: tier,
          subscriptionStatus: 'active',
          polarSubscriptionId: subscription.id,
          polarCustomerId: subscription.customer_id,
          subscriptionCurrentPeriodStart: new Date(subscription.current_period_start),
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end),
          paymentProvider: 'polar',
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      
      console.log(`💾 Main transaction: Updated user tier and Polar data`);
    });

    // 🔄 SYNC: Centralized subscription service (outside transaction for service isolation)  
    try {
      await updateUserSubscription(user.id, {
        tier,
        status: 'active',
        currentPeriodStart: new Date(subscription.current_period_start),
        currentPeriodEnd: new Date(subscription.current_period_end),
      });
      console.log(`💾 Subscription service sync completed`);
    } catch (syncError) {
      console.error(`⚠️ Subscription service sync failed (user update succeeded):`, syncError);
      // Continue - main database update succeeded, sync failure is non-critical
      // This could be handled by a background job or manual reconciliation
    }

    // Verify the update
    const verifyUser = await db
      .select({ subscriptionTier: users.subscriptionTier, subscriptionStatus: users.subscriptionStatus })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    console.log(`✅ Subscription activated successfully - user ${user.id} (${user.email}) upgraded to ${tier}`);
    console.log(`✅ Verification: User now has tier=${verifyUser[0]?.subscriptionTier}, status=${verifyUser[0]?.subscriptionStatus}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to process subscription.active for ${subscription.id}:`, errorMessage);
    
    // 🔄 ERROR TYPE DISTINCTION: Handle different error types appropriately
    if (errorMessage.includes('User not found')) {
      // Retryable error - user might be created later, or email lookup issue
      console.error(`🔄 RETRYABLE: User not found - webhook will retry`);
      throw error; // Re-throw to trigger webhook retry
      
    } else if (errorMessage.includes('database') || errorMessage.includes('timeout')) {
      // Retryable error - temporary infrastructure issue  
      console.error(`🔄 RETRYABLE: Database/infrastructure issue - webhook will retry`);
      throw error; // Re-throw to trigger webhook retry
      
    } else if (errorMessage.includes('Unknown product ID')) {
      // Non-retryable error - configuration issue, manual intervention needed
      console.error(`❌ NON-RETRYABLE: Invalid product configuration - requires manual intervention`);
      console.error(`❌ Manual action required: Check POLAR_PRO_PRODUCT_ID and POLAR_BASIC_PRODUCT_ID environment variables`);
      // Don't re-throw - this prevents infinite retries for config issues
      
    } else {
      // Unknown error - be conservative and allow retries for debugging
      console.error(`⚠️ UNKNOWN ERROR: Being conservative - allowing retry for investigation`);
      throw error; // Re-throw to allow debugging
    }
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
  
  // Use enhanced user lookup instead of metadata
  const user = await findUserForWebhook(subscription);
  if (!user) {
    console.error('❌ User not found for subscription.created webhook');
    return;
  }

  console.log(`👤 Found user: ${user.id} (${user.email})`);

  // Determine tier from product ID (more reliable than metadata)
  let tier: SubscriptionTier = 'free';
  const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
  const basicProductId = process.env.POLAR_BASIC_PRODUCT_ID;
  const productId = subscription.product_id;
  
  if (productId === proProductId) {
    tier = 'pro';
  } else if (productId === basicProductId) {
    tier = 'basic';
  } else {
    console.warn(`⚠️ Unknown product ID in subscription.created: ${productId}, defaulting to free tier`);
  }

  console.log(`🔄 Creating subscription for user ${user.id} with tier: ${tier}`);

  // Check for admin override
  const hasActiveAdminOverride = user.adminOverrideTier && 
    (!user.adminOverrideExpires || user.adminOverrideExpires > new Date());

  if (hasActiveAdminOverride) {
    console.log(`ℹ️ User ${user.id} has active admin override, only updating Polar data`);
  }

  // Update Polar-specific fields directly
  await db
    .update(users)
    .set({
      polarSubscriptionId: subscription.id,
      polarCustomerId: subscription.customer_id,
      paymentProvider: 'polar',
      subscriptionCurrentPeriodStart: new Date(subscription.current_period_start),
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end),
      // Only update tier if no admin override
      ...(hasActiveAdminOverride ? {} : { subscriptionTier: tier, subscriptionStatus: 'active' }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Use centralized subscription service if no admin override
  if (!hasActiveAdminOverride) {
    await updateUserSubscription(user.id, {
      tier,
      status: 'active',
      currentPeriodStart: new Date(subscription.current_period_start),
      currentPeriodEnd: new Date(subscription.current_period_end),
    });
  }

  console.log(`✅ Subscription created successfully - user ${user.id} (${user.email}) has ${hasActiveAdminOverride ? 'admin override' : tier} tier`);
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
  console.log('🔄 Order paid webhook received:', order.id);
  console.log('ℹ️ Note: order.paid is supplementary - subscription.active is primary for upgrades');
  
  // Use enhanced user lookup
  const user = await findUserForWebhook(order);
  if (!user) {
    console.error('❌ User not found for order.paid webhook');
    return;
  }

  console.log(`👤 Found user: ${user.id} (${user.email})`);
  
  // Determine subscription tier based on product ID
  let tier: SubscriptionTier = 'free';
  const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
  const basicProductId = process.env.POLAR_BASIC_PRODUCT_ID;
  const productId = order.product_id;
  const subscriptionId = order.subscription_id;
  
  console.log(`🔍 Product matching: webhook=${productId}, env=${proProductId}, match=${productId === proProductId}`);
  
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

  // Update user subscription directly (includes Polar-specific fields) with better error handling
  try {
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
      console.log(`🎯 Updating user ${user.id} to tier: ${tier}`);
    } else {
      console.log(`ℹ️ User ${user.id} has admin override - preserving existing tier`);
    }

    console.log(`💾 Executing database update...`);
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id));

    console.log(`💾 Database update completed successfully`);

    // Also use centralized service to sync limits and monthly usage
    console.log(`🔄 Syncing with centralized subscription service...`);
    await updateUserSubscription(user.id, {
      tier: hasActiveAdminOverride ? undefined : tier,
      status: 'active',
      currentPeriodStart: updateData.currentPeriodStart,
      currentPeriodEnd: updateData.currentPeriodEnd,
    });

    console.log(`✅ Order processed successfully - user ${user.id} (${user.email}) upgraded to ${hasActiveAdminOverride ? 'admin override tier' : tier}`);

    // Verify the update actually worked by re-querying the user
    const verifyUser = await db
      .select({ subscriptionTier: users.subscriptionTier, subscriptionStatus: users.subscriptionStatus })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (verifyUser.length > 0) {
      console.log(`✅ Verification: User now has tier=${verifyUser[0].subscriptionTier}, status=${verifyUser[0].subscriptionStatus}`);
    }

  } catch (dbError) {
    console.error(`❌ Database update failed for user ${user.id}:`, dbError);
    throw dbError; // Re-throw to ensure webhook fails properly
  }
}

// Note: Now using centralized updateUserSubscription from @/lib/subscription/service
// This ensures consistency across all subscription updates and proper limit enforcement