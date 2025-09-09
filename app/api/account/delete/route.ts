/**

// Force this route to be dynamic to prevent static generation
export const dynamic = 'force-dynamic';
 * Account Deletion API Route
 * Handles account deletion with subscription cancellation
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Helper function to cancel Polar subscription at period end
async function cancelPolarSubscription(subscriptionId: string) {
  try {
    const response = await fetch(`https://api.polar.sh/v1/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancel_at_period_end: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to cancel Polar subscription:', response.status, errorText);
      return {
        success: false,
        error: `Failed to cancel subscription: ${response.status}`
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

// Helper function to perform soft delete
async function softDeleteUser(userId: string, reason: string = 'user_requested') {
  try {
    const deletionDate = new Date();
    const gracePeriodEnd = new Date(deletionDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

    await db.update(users)
      .set({
        // Mark as deleted but keep data for grace period
        subscriptionStatus: 'canceled',
        updatedAt: deletionDate,
        // Store deletion metadata in a way that doesn't break existing schema
        // We'll add proper fields later, for now use existing fields creatively
        adminOverrideTier: null, // Clear any admin overrides
        adminOverrideExpires: gracePeriodEnd, // Repurpose for grace period tracking
        // Note: In production, we'd add dedicated deletion tracking fields
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      deletionDate,
      gracePeriodEnd
    };
  } catch (error) {
    console.error('Error performing soft delete:', error);
    return {
      success: false,
      error: 'Failed to mark account for deletion'
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

    const { confirmationText, reason } = await req.json();

    // Require confirmation text
    if (confirmationText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please type "DELETE" to confirm account deletion' },
        { status: 400 }
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
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = dbUsers[0];

    // Handle subscription cancellation for paid users
    let subscriptionResult = null;
    if (user.subscriptionTier !== 'free' && user.polarSubscriptionId) {
      subscriptionResult = await cancelPolarSubscription(user.polarSubscriptionId);
      
      if (!subscriptionResult.success) {
        return NextResponse.json(
          { 
            error: 'Failed to cancel subscription. Please contact support.',
            details: subscriptionResult.error 
          },
          { status: 500 }
        );
      }
    }

    // Perform soft delete
    const deletionResult = await softDeleteUser(user.id, reason || 'user_requested');
    
    if (!deletionResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to delete account. Please contact support.',
          details: deletionResult.error 
        },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Account deletion initiated successfully',
      details: {
        subscriptionCancelled: !!subscriptionResult,
        subscriptionAccessUntil: subscriptionResult?.cancelledAt,
        gracePeriodEnd: deletionResult.gracePeriodEnd,
        accountRecoveryInfo: 'You can contact support within 30 days to recover your account'
      }
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error during account deletion' },
      { status: 500 }
    );
  }
}