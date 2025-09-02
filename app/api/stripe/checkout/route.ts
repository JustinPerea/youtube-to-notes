// Stripe Checkout Session API Route
// Ready to activate once business email and Stripe account are configured

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth';
import { createCheckoutSession, isStripeReady } from '../../../../lib/stripe/stripe';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Request validation schema
const CheckoutRequestSchema = z.object({
  tier: z.enum(['student', 'pro', 'creator']),
  billing: z.enum(['monthly', 'yearly']),
  studentDiscount: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated using custom getServerSession helper
    let session = await getServerSession(req);
    console.log('Checkout API - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
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
          error: 'Payment system not available',
          message: 'Stripe integration is being set up. Please check back soon!'
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = CheckoutRequestSchema.parse(body);

    const { tier, billing, studentDiscount } = validatedData;

    // Create Stripe Checkout Session
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email!,
      tier,
      billing,
      studentDiscount,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('Stripe Checkout Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle specific Stripe errors
      if (error.message.includes('Stripe not configured')) {
        return NextResponse.json(
          { 
            error: 'Payment system not available',
            message: 'Stripe integration is being set up. Please check back soon!'
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create checkout session', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const stripeReady = isStripeReady();
  
  return NextResponse.json({
    status: stripeReady ? 'ready' : 'not_configured',
    message: stripeReady 
      ? 'Stripe checkout is ready' 
      : 'Stripe is not yet configured. Business email setup in progress.',
  });
}