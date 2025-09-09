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
              title: 'Cancel Subscription',
              description: 'Cancel your current subscription',
              action: 'cancel',
              warning: 'Your subscription will remain active until the end of your current billing period'
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