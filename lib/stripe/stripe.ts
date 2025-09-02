// Stripe service for handling payments and subscriptions
// Ready to activate once Stripe account is set up with business email

import Stripe from 'stripe';
import { STRIPE_CONFIG, getStripePriceId, STUDENT_DISCOUNT } from './config';

// Initialize Stripe (will work once environment variables are set)
let stripe: Stripe | null = null;

if (STRIPE_CONFIG.secretKey && !STRIPE_CONFIG.secretKey.includes('placeholder')) {
  stripe = new Stripe(STRIPE_CONFIG.secretKey, {
    apiVersion: '2025-08-27.basil',
  });
}

export interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  tier: 'student' | 'pro' | 'creator';
  billing: 'monthly' | 'yearly';
  studentDiscount?: boolean;
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

  const { userId, email, tier, billing, studentDiscount = false } = params;
  const priceId = getStripePriceId(tier, billing);

  if (!priceId) {
    throw new Error(`Invalid pricing tier: ${tier} ${billing}`);
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
      billing,
      studentDiscount: studentDiscount.toString(),
    },
    subscription_data: {
      metadata: {
        userId,
        tier,
        billing,
      },
    },
  };

  // Apply student discount if applicable
  if (studentDiscount && tier === 'student') {
    sessionParams.discounts = [
      {
        coupon: STUDENT_DISCOUNT.couponId,
      },
    ];
  }

  // Add trial period for premium tiers
  if (tier === 'pro' || tier === 'creator') {
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
  const userId = subscription.metadata.userId;
  const tier = subscription.metadata.tier as 'student' | 'pro' | 'creator';
  
  // TODO: Update user's subscription in database
  console.log(`Subscription created for user ${userId} with tier ${tier}`);
  
  // You'll implement this when database schema is updated
  // await updateUserSubscription(userId, {
  //   stripeCustomerId: subscription.customer as string,
  //   stripeSubscriptionId: subscription.id,
  //   tier,
  //   status: 'active',
  //   currentPeriodStart: new Date(subscription.current_period_start * 1000),
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  // });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  
  console.log(`Subscription updated for user ${userId}`);
  
  // TODO: Update subscription status in database
  // await updateUserSubscription(userId, {
  //   status: subscription.status as any,
  //   currentPeriodStart: new Date(subscription.current_period_start * 1000),
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  // });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  
  console.log(`Subscription deleted for user ${userId}`);
  
  // TODO: Update user to free tier
  // await updateUserSubscription(userId, {
  //   tier: 'free',
  //   status: 'cancelled',
  // });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice ${invoice.id}`);
  
  // TODO: Log payment success, send confirmation email
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice ${invoice.id}`);
  
  // TODO: Handle failed payment, notify user
}

// Verify webhook signature
export function verifyWebhookSignature(body: string, signature: string): Stripe.Event {
  if (!stripe || !STRIPE_CONFIG.webhookSecret) {
    throw new Error('Stripe not configured');
  }

  return stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
}

// Helper function to check if Stripe is ready
export function isStripeReady(): boolean {
  return stripe !== null;
}