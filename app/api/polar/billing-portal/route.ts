/**
 * Polar Billing Management API Route
 * Creates billing management options for Polar subscriptions
 */

// Force this route to be dynamic to prevent static generation
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Helper function to fetch Polar subscription details
async function fetchPolarSubscriptionDetails(subscriptionId: string) {
  try {
    const response = await fetch(`https://api.polar.sh/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Polar subscription:', response.status, response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Polar subscription details:', error);
    return null;
  }
}

// Try to create a Polar customer portal session and return a one-time URL
async function createPolarPortalSession(customerId: string, returnUrl: string): Promise<string | null> {
  try {
    const token = process.env.POLAR_ACCESS_TOKEN;
    if (!token || !customerId) return null;

    const endpoints = [
      'https://api.polar.sh/v1/customer-portal/sessions',
      'https://api.polar.sh/v1/customer_portal/sessions',
      `https://api.polar.sh/v1/customers/${customerId}/portal`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ customer_id: customerId, return_url: returnUrl }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          console.warn('Polar portal session attempt failed:', { url, status: res.status, txt });
          continue;
        }
        const data: any = await res.json().catch(() => ({}));
        const portalUrl = data.url || data.portal_url || data.session_url || null;
        if (portalUrl) return portalUrl as string;
      } catch (e) {
        console.warn('Polar portal session endpoint error:', url, e);
      }
    }
  } catch (e) {
    console.error('createPolarPortalSession error:', e);
  }
  return null;
}

// Helper function to format pricing
function formatPolarPricing(amount: number, currency: string = 'USD', interval: string = 'month') {
  const formatted = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  });
  
  const intervalText = interval === 'year' ? 'year' : 'month';
  return `${formatted}/${intervalText}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const dbUsers = await db
      .select()
      .from(users)
      .where(eq(users.oauthId, session.user.id))
      .limit(1);

    if (dbUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const user = dbUsers[0];

    // Fetch real subscription details from Polar if available
    let polarSubscription = null;
    if (user.polarSubscriptionId) {
      polarSubscription = await fetchPolarSubscriptionDetails(user.polarSubscriptionId);
    }

    // For Polar, we provide different management options based on subscription status
    if (user.subscriptionTier === 'free') {
      // Free users - redirect to pricing page for upgrades
      return NextResponse.json({
        type: 'upgrade',
        url: `${process.env.NODE_ENV === 'production' ? 'https://www.kyotoscribe.com' : 'http://localhost:3003'}/pricing`,
        message: 'Upgrade to unlock premium features'
      });
    } else {
      // Paid users - provide Polar customer portal if available, or billing information
      if (user.polarCustomerId) {
        // If we have a Polar customer ID, we can provide more specific management
        const defaultReturn = process.env.NODE_ENV === 'production' ? 'https://www.kyotoscribe.com/profile' : 'http://localhost:3003/profile';
        const sessionUrl = await createPolarPortalSession(user.polarCustomerId, defaultReturn);
        const portalUrl = sessionUrl 
          || process.env.POLAR_CUSTOMER_PORTAL_URL 
          || 'https://polar.sh/login';
        return NextResponse.json({
          type: 'manage',
          options: [
            {
              title: 'View Current Plan',
              description: `You are currently on the ${user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)} plan`,
              action: 'info'
            },
            {
              title: 'Change Plan', 
              description: 'Upgrade or downgrade your subscription',
              action: 'change_plan',
              url: `${process.env.NODE_ENV === 'production' ? 'https://www.kyotoscribe.com' : 'http://localhost:3003'}/pricing`
            },
            {
              title: 'Manage Subscription',
              description: 'Cancel, modify, or view your subscription details in Polar',
              action: 'polar_portal',
              url: portalUrl
            },
            {
              title: 'Contact Support',
              description: 'Need help with your subscription?',
              action: 'support',
              url: 'mailto:support@shibabrothers.com?subject=Subscription Support'
            }
          ],
          subscriptionDetails: {
            tier: user.subscriptionTier,
            status: user.subscriptionStatus,
            provider: user.paymentProvider,
            currentPeriodStart: user.subscriptionCurrentPeriodStart,
            currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
            polarSubscriptionId: user.polarSubscriptionId,
            polarCustomerId: user.polarCustomerId,
            // Include real pricing from Polar API
            actualPrice: polarSubscription ? formatPolarPricing(
              polarSubscription.amount, 
              polarSubscription.currency, 
              polarSubscription.recurring_interval
            ) : null,
            discountApplied: polarSubscription?.discount_id ? true : false,
            currency: polarSubscription?.currency || 'USD',
            billingInterval: polarSubscription?.recurring_interval || 'month'
          }
        });
      } else {
        // Fallback for users without Polar customer ID
        return NextResponse.json({
          type: 'limited',
          message: 'Limited billing management available',
          options: [
            {
              title: 'Contact Support for Billing Changes',
              description: 'Our support team can help you manage your subscription',
              action: 'support',
              url: 'mailto:support@shibabrothers.com?subject=Subscription Management'
            },
            {
              title: 'View Pricing Plans',
              description: 'See all available subscription options',
              action: 'pricing',
              url: `${process.env.NODE_ENV === 'production' ? 'https://www.kyotoscribe.com' : 'http://localhost:3003'}/pricing`
            }
          ]
        });
      }
    }

  } catch (error) {
    console.error('Polar billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing management session' },
      { status: 500 }
    );
  }
}
