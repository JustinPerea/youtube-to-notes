/**
 * Polar Subscription Cancellation API Route
 * Handles subscription cancellation through Polar API
 */

// Force this route to be dynamic to prevent static generation
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Helper function to cancel Polar subscription at period end
async function cancelPolarSubscription(subscriptionId: string) {
  try {
    // Debug: Check if access token is available
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('❌ POLAR_ACCESS_TOKEN environment variable is not set');
      return {
        success: false,
        error: 'Polar access token not configured'
      };
    }

    console.log(`🔑 Using Polar access token: ${accessToken.substring(0, 10)}...`);
    console.log(`🎯 Cancelling subscription: ${subscriptionId}`);

    const response = await fetch(`https://api.polar.sh/v1/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancel_at_period_end: true
      })
    });

    console.log(`📡 Polar API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to cancel Polar subscription:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        subscriptionId: subscriptionId
      });
      return {
        success: false,
        error: `Failed to cancel subscription: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    return {
      success: true,
      subscription: result,
      cancelledAt: result.cancel_at_period_end ? result.current_period_end : new Date()
    };
  } catch (error) {
    console.error('Error cancelling Polar subscription:', error);
    return {
      success: false,
      error: 'Network error while cancelling subscription'
    };
  }
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

    // Check if user has an active subscription
    if (user.subscriptionTier === 'free') {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 400 }
      );
    }

    // Check if user has a Polar subscription ID
    if (!user.polarSubscriptionId) {
      return NextResponse.json(
        { error: 'No subscription found to cancel. Please contact support.' },
        { status: 400 }
      );
    }

    // Cancel the subscription through Polar API
    const cancellationResult = await cancelPolarSubscription(user.polarSubscriptionId);

    if (!cancellationResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to cancel subscription',
          details: cancellationResult.error 
        },
        { status: 500 }
      );
    }

    // Update user's subscription status in database
    await db
      .update(users)
      .set({
        subscriptionCancelAtPeriodEnd: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    console.log(`✅ Subscription cancelled for user ${user.id}: ${user.polarSubscriptionId}`);

    // Format the current period end date properly
    const currentPeriodEnd = cancellationResult.subscription.current_period_end;
    let formattedEndDate;
    
    if (typeof currentPeriodEnd === 'string') {
      // If it's already a string, use it directly
      formattedEndDate = new Date(currentPeriodEnd).toISOString();
    } else if (typeof currentPeriodEnd === 'number') {
      // If it's a timestamp, convert it
      formattedEndDate = new Date(currentPeriodEnd * 1000).toISOString();
    } else {
      // Fallback to current date + 1 month
      const fallbackDate = new Date();
      fallbackDate.setMonth(fallbackDate.getMonth() + 1);
      formattedEndDate = fallbackDate.toISOString();
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: user.polarSubscriptionId,
        cancelledAt: cancellationResult.cancelledAt,
        currentPeriodEnd: formattedEndDate,
        cancelAtPeriodEnd: true
      }
    });

  } catch (error) {
    console.error('Polar subscription cancellation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
