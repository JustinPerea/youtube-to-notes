import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export const dynamic = 'force-dynamic';

interface CreatePortalSessionResponse {
  url: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Helper function to get user from database using OAuth ID
 */
async function getUserFromDatabase(oauthId: string): Promise<any> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.oauthId, oauthId),
          eq(users.oauthProvider, 'google')
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    throw new Error('Failed to fetch user data');
  }
}

/**
 * Helper function to create or retrieve Stripe customer
 */
async function getOrCreateStripeCustomer(user: any): Promise<string> {
  try {
    // If user already has a Stripe customer ID, verify it exists
    if (user.stripeCustomerId) {
      try {
        const existingCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (existingCustomer && !existingCustomer.deleted) {
          console.log('Using existing Stripe customer:', user.stripeCustomerId);
          return user.stripeCustomerId;
        }
      } catch (stripeError: any) {
        console.warn('Existing Stripe customer not found or invalid:', stripeError.message);
        // Continue to create new customer
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: user.id,
        oauthId: user.oauthId || '',
        createdVia: 'portal-session-api',
      },
    });

    console.log('Created new Stripe customer:', customer.id);

    // Update user record with Stripe customer ID
    await db
      .update(users)
      .set({
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return customer.id;
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error);
    throw new Error('Failed to create Stripe customer');
  }
}

/**
 * POST /api/create-portal-session
 * Creates a Stripe Customer Portal session for the authenticated user
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreatePortalSessionResponse | ErrorResponse>> {
  try {
    console.log('Creating Stripe portal session...');

    // 1. Authenticate user
    const session = await getServerSession(request);
    if (!session || !session.user || !session.user.id) {
      console.log('No valid session found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { user: sessionUser } = session;
    console.log('Authenticated user:', { 
      id: sessionUser.id, 
      email: sessionUser.email,
      oauthId: sessionUser.oauthId 
    });

    // 2. Get user from database using OAuth ID
    if (!sessionUser.oauthId) {
      console.error('No OAuth ID found in session');
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 400 }
      );
    }

    const dbUser = await getUserFromDatabase(sessionUser.oauthId);
    if (!dbUser) {
      console.error('User not found in database:', sessionUser.oauthId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Database user found:', { 
      id: dbUser.id, 
      email: dbUser.email,
      hasStripeCustomerId: !!dbUser.stripeCustomerId 
    });

    // 3. Validate environment
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured');
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 500 }
      );
    }

    // 4. Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(dbUser);

    // 5. Create portal session
    const returnUrl = process.env.NEXTAUTH_URL?.trim() || 'https://kyotoscribe.com';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${returnUrl}/dashboard`,
    });

    console.log('Stripe portal session created:', {
      id: portalSession.id,
      customerId: stripeCustomerId,
      url: portalSession.url
    });

    // 6. Return portal URL
    return NextResponse.json(
      { url: portalSession.url },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error creating portal session:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeError') {
      return NextResponse.json(
        { 
          error: 'Stripe error occurred',
          details: error.message 
        },
        { status: 400 }
      );
    }

    // Handle database errors
    if (error.message?.includes('database') || error.message?.includes('connection')) {
      return NextResponse.json(
        { 
          error: 'Database error occurred',
          details: 'Unable to access user data' 
        },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}