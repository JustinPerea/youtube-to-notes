// Stripe Customer Portal API Route
// Allows users to manage their subscriptions

import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionWithDatabase } from '../../../../lib/auth-utils';
import { createCustomerPortalSession, isStripeReady } from '../../../../lib/stripe/stripe';
import { getUserSubscription } from '../../../../lib/services/subscription';

export async function POST(req: NextRequest) {
  try {
    // Use new hybrid authentication approach
    const session = await getApiSessionWithDatabase(req);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if Stripe is configured
    if (!isStripeReady()) {
      return NextResponse.json(
        { 
          error: 'Customer portal not available',
          message: 'Stripe integration is being set up. Please check back soon!'
        },
        { status: 503 }
      );
    }

    // Get user's subscription to find their Stripe customer ID
    const userSubscription = await getUserSubscription(session.user.id);
    
    if (!userSubscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Parse request body for return URL
    const { returnUrl } = await req.json();
    const validReturnUrl = returnUrl || `${process.env.NEXTAUTH_URL}/account`;

    // Create customer portal session
    const portalSession = await createCustomerPortalSession({
      customerId: userSubscription.stripeCustomerId,
      returnUrl: validReturnUrl,
    });

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error) {
    console.error('Customer Portal Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Stripe not configured')) {
        return NextResponse.json(
          { 
            error: 'Customer portal not available',
            message: 'Stripe integration is being set up. Please check back soon!'
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create portal session', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  const stripeReady = isStripeReady();
  
  return NextResponse.json({
    status: stripeReady ? 'ready' : 'not_configured',
    message: stripeReady 
      ? 'Customer portal is ready' 
      : 'Stripe is not yet configured. Business email setup in progress.',
  });
}