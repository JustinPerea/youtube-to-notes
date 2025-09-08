// Stripe service for handling payments and subscriptions
// Ready to activate once Stripe account is set up with business email

import Stripe from 'stripe';
import { STRIPE_CONFIG, getStripePriceId, EDUCATIONAL_DISCOUNT, STRIPE_PRICES } from './config';
import { db } from '../db/connection';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { updateUserSubscription } from '../subscription/service';
import type { SubscriptionTier } from '../subscription/config';

// Initialize Stripe (will work once environment variables are set)
let stripe: Stripe | null = null;

if (STRIPE_CONFIG.secretKey && !STRIPE_CONFIG.secretKey.includes('placeholder')) {
  stripe = new Stripe(STRIPE_CONFIG.secretKey, {
    apiVersion: '2025-02-24.acacia',
  });
}

export interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  tier: 'basic' | 'pro';
  educationalDiscount?: boolean;
}

export interface CustomerPortalParams {
  customerId: string;
  returnUrl: string;
}

// Create Stripe Checkout Session
export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  if (!stripe) {
    throw new Error('Stripe not configured. Please set up your business email and Stripe account first.');
  }

  const { userId, email, tier, educationalDiscount = false } = params;
  const priceId = getStripePriceId(tier);

  if (!priceId) {
    throw new Error(`Invalid pricing tier: ${tier}`);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: STRIPE_CONFIG.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: STRIPE_CONFIG.cancelUrl,
    client_reference_id: userId,
    customer_email: email,
    metadata: {
      userId,
      tier,
      educationalDiscount: educationalDiscount.toString(),
    },
    subscription_data: {
      metadata: {
        userId,
        tier,
      },
    },
  };

  // Apply educational discount if applicable
  if (educationalDiscount && tier === 'basic') {
    sessionParams.discounts = [
      {
        coupon: EDUCATIONAL_DISCOUNT.couponId,
      },
    ];
  }

  // Add trial period for premium tiers
  if (tier === 'pro') {
    sessionParams.subscription_data!.trial_period_days = 7;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

// Create Customer Portal Session
export async function createCustomerPortalSession(params: CustomerPortalParams) {
  if (!stripe) {
    throw new Error('Stripe not configured. Please set up your business email and Stripe account first.');
  }

  const { customerId, returnUrl } = params;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return portalSession;
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['customer', 'items.data.price.product'],
  });

  return subscription;
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

// Reactivate subscription
export async function reactivateSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}

// Process webhook events
export async function handleWebhookEvent(event: Stripe.Event) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  switch (event.type) {
    case 'customer.subscription.created':
      return handleSubscriptionCreated(event.data.object as Stripe.Subscription);
    
    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
    
    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    
    case 'invoice.payment_succeeded':
      return handlePaymentSucceeded(event.data.object as Stripe.Invoice);
    
    case 'invoice.payment_failed':
      return handlePaymentFailed(event.data.object as Stripe.Invoice);
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`🔔 Webhook: Subscription created - ${subscription.id}`);
  
  try {
    // Find user by customer ID first, then by metadata
    let userId = await findUserByStripeCustomer(subscription.customer as string);
    if (!userId) {
      userId = await findUserByMetadata(subscription.metadata);
    }
    
    if (!userId) {
      console.error('❌ User not found for subscription:', subscription.id);
      throw new Error(`User not found for subscription ${subscription.id}`);
    }

    // Determine subscription tier
    const tier = await getSubscriptionTier(subscription);
    
    console.log(`📝 Creating subscription for user ${userId} with tier ${tier}`);
    
    // Check for admin override - don't update if user has active admin override
    const currentUserResult = await db
      .select({ 
        adminOverrideTier: users.adminOverrideTier,
        adminOverrideExpires: users.adminOverrideExpires 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const currentUser = currentUserResult[0];
    const hasActiveAdminOverride = currentUser?.adminOverrideTier && 
      (!currentUser.adminOverrideExpires || currentUser.adminOverrideExpires > new Date());

    if (hasActiveAdminOverride) {
      console.log(`⚠️ User ${userId} has active admin override - preserving override but updating Stripe data`);
    }

    // Update user subscription
    await updateUserSubscription(userId, {
      tier: hasActiveAdminOverride ? undefined : tier, // Don't override admin tier
      status: 'active',
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(`✅ Subscription created successfully for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling subscription creation:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`🔔 Webhook: Subscription updated - ${subscription.id}`);
  
  try {
    // Find user by customer ID first, then by metadata
    let userId = await findUserByStripeCustomer(subscription.customer as string);
    if (!userId) {
      userId = await findUserByMetadata(subscription.metadata);
    }
    
    if (!userId) {
      console.error('❌ User not found for subscription update:', subscription.id);
      throw new Error(`User not found for subscription ${subscription.id}`);
    }

    // Determine subscription tier from the updated subscription
    const tier = await getSubscriptionTier(subscription);
    
    console.log(`📝 Updating subscription for user ${userId} - Status: ${subscription.status}, Tier: ${tier}`);

    // Check for admin override - don't update tier if user has active admin override
    const currentUserResult = await db
      .select({ 
        adminOverrideTier: users.adminOverrideTier,
        adminOverrideExpires: users.adminOverrideExpires 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const currentUser = currentUserResult[0];
    const hasActiveAdminOverride = currentUser?.adminOverrideTier && 
      (!currentUser.adminOverrideExpires || currentUser.adminOverrideExpires > new Date());

    if (hasActiveAdminOverride) {
      console.log(`⚠️ User ${userId} has active admin override - preserving override tier`);
    }

    // Map Stripe subscription status to our status
    const statusMapping: Record<string, 'active' | 'canceled' | 'past_due' | 'incomplete'> = {
      'active': 'active',
      'canceled': 'canceled',
      'incomplete': 'incomplete',
      'incomplete_expired': 'incomplete',
      'past_due': 'past_due',
      'unpaid': 'past_due',
      'trialing': 'active',
    };
    
    const status = statusMapping[subscription.status] || 'incomplete';

    // Update user subscription
    await updateUserSubscription(userId, {
      tier: hasActiveAdminOverride ? undefined : tier, // Don't override admin tier
      status,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(`✅ Subscription updated successfully for user ${userId} - Status: ${status}`);
  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`🔔 Webhook: Subscription deleted - ${subscription.id}`);
  
  try {
    // Find user by customer ID first, then by metadata
    let userId = await findUserByStripeCustomer(subscription.customer as string);
    if (!userId) {
      userId = await findUserByMetadata(subscription.metadata);
    }
    
    if (!userId) {
      console.error('❌ User not found for subscription deletion:', subscription.id);
      throw new Error(`User not found for subscription ${subscription.id}`);
    }

    console.log(`📝 Deleting subscription for user ${userId} - reverting to free tier`);

    // Check for admin override - don't update tier if user has active admin override
    const currentUserResult = await db
      .select({ 
        adminOverrideTier: users.adminOverrideTier,
        adminOverrideExpires: users.adminOverrideExpires 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const currentUser = currentUserResult[0];
    const hasActiveAdminOverride = currentUser?.adminOverrideTier && 
      (!currentUser.adminOverrideExpires || currentUser.adminOverrideExpires > new Date());

    if (hasActiveAdminOverride) {
      console.log(`⚠️ User ${userId} has active admin override - preserving override tier`);
    }

    // Update user subscription - revert to free tier if no admin override
    await updateUserSubscription(userId, {
      tier: hasActiveAdminOverride ? undefined : 'free',
      status: 'canceled',
      // Keep Stripe IDs for historical reference
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: false, // Subscription is fully canceled
    });

    console.log(`✅ Subscription deleted successfully for user ${userId} - reverted to free tier`);
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`🔔 Webhook: Payment succeeded - Invoice ${invoice.id}`);
  
  try {
    const subscriptionId = (invoice as any).subscription;
    if (!subscriptionId) {
      console.log('⚠️ No subscription associated with invoice, skipping');
      return;
    }

    // Find user by customer ID
    let userId = await findUserByStripeCustomer(invoice.customer as string);
    
    if (!userId) {
      console.error('❌ User not found for payment success:', invoice.id);
      // Don't throw here - payment succeeded but we can't find user
      return;
    }

    console.log(`💳 Payment succeeded for user ${userId} - Invoice: ${invoice.id}, Amount: $${(invoice.amount_paid / 100).toFixed(2)}`);
    
    // If this is a subscription renewal, ensure the user's subscription is active
    if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') {
      // Check for admin override - don't update status if user has active admin override
      const currentUserResult = await db
        .select({ 
          adminOverrideTier: users.adminOverrideTier,
          adminOverrideExpires: users.adminOverrideExpires 
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const currentUser = currentUserResult[0];
      const hasActiveAdminOverride = currentUser?.adminOverrideTier && 
        (!currentUser.adminOverrideExpires || currentUser.adminOverrideExpires > new Date());

      if (!hasActiveAdminOverride) {
        // Update subscription status to active on successful payment
        await updateUserSubscription(userId, {
          status: 'active',
        });
        console.log(`✅ Subscription reactivated for user ${userId} after successful payment`);
      }
    }
    
    console.log(`✅ Payment processing completed for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    // Don't throw here - payment succeeded, but we had issues updating our records
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`🔔 Webhook: Payment failed - Invoice ${invoice.id}`);
  
  try {
    const subscriptionId = (invoice as any).subscription;
    if (!subscriptionId) {
      console.log('⚠️ No subscription associated with invoice, skipping');
      return;
    }

    // Find user by customer ID
    let userId = await findUserByStripeCustomer(invoice.customer as string);
    
    if (!userId) {
      console.error('❌ User not found for payment failure:', invoice.id);
      return;
    }

    console.log(`💳 Payment failed for user ${userId} - Invoice: ${invoice.id}, Amount: $${(invoice.amount_due / 100).toFixed(2)}`);
    
    // Check for admin override - don't update status if user has active admin override
    const currentUserResult = await db
      .select({ 
        adminOverrideTier: users.adminOverrideTier,
        adminOverrideExpires: users.adminOverrideExpires 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const currentUser = currentUserResult[0];
    const hasActiveAdminOverride = currentUser?.adminOverrideTier && 
      (!currentUser.adminOverrideExpires || currentUser.adminOverrideExpires > new Date());

    if (!hasActiveAdminOverride) {
      // Update subscription status to past_due on failed payment
      await updateUserSubscription(userId, {
        status: 'past_due',
      });
      console.log(`⚠️ Subscription marked as past_due for user ${userId} after failed payment`);
    } else {
      console.log(`⚠️ User ${userId} has active admin override - preserving status despite payment failure`);
    }
    
    console.log(`✅ Payment failure processing completed for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    // Don't throw here - we want to acknowledge the webhook even if our processing failed
  }
}

// Verify webhook signature
export function verifyWebhookSignature(body: string, signature: string): Stripe.Event {
  if (!stripe || !STRIPE_CONFIG.webhookSecret) {
    throw new Error('Stripe not configured');
  }

  return stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
}

// Price ID to subscription tier mapping
const STRIPE_PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  'price_1S2uKwE61emw6urZuJa7iMo9': 'basic', // basic_monthly
  'price_1S2uLKE61emw6urZCl9Ne0mu': 'basic', // basic_yearly
  'price_1S2uLYE61emw6urZoOGcTGfW': 'pro',     // pro_monthly
  'price_1S2uLrE61emw6urZ20oHhP5r': 'pro',     // pro_yearly
  'price_1S2uM4E61emw6urZjCGcU3oc': 'pro',     // creator_monthly -> map to 'pro' since schema only has 3 tiers
  'price_1S2uMVE61emw6urZ3wloIrMQ': 'pro',     // creator_yearly -> map to 'pro' since schema only has 3 tiers
} as const;

// Helper function to map Stripe price to our subscription tier
function getPriceIdToTier(priceId: string): SubscriptionTier {
  return STRIPE_PRICE_TO_TIER[priceId] || 'free';
}

// Helper function to find user by Stripe customer ID or OAuth ID
async function findUserByStripeCustomer(customerId: string): Promise<string | null> {
  try {
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);

    if (userResult.length > 0) {
      return userResult[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error finding user by Stripe customer ID:', error);
    return null;
  }
}

// Helper function to find user by metadata (fallback)
async function findUserByMetadata(metadata: Record<string, string>): Promise<string | null> {
  const userId = metadata.userId;
  if (!userId) return null;

  try {
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return userResult.length > 0 ? userId : null;
  } catch (error) {
    console.error('Error finding user by metadata:', error);
    return null;
  }
}

// Helper function to determine subscription tier from Stripe subscription
async function getSubscriptionTier(subscription: Stripe.Subscription): Promise<SubscriptionTier> {
  // Check metadata first
  if (subscription.metadata.tier) {
    return subscription.metadata.tier as SubscriptionTier;
  }

  // Get the first price ID from the subscription items
  const firstItem = subscription.items.data[0];
  if (firstItem?.price?.id) {
    return getPriceIdToTier(firstItem.price.id);
  }

  // Default fallback
  return 'free';
}

// Helper function to check if Stripe is ready
export function isStripeReady(): boolean {
  return stripe !== null;
}