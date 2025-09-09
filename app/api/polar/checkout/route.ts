/**
 * Polar Checkout API Route
 * Creates checkout sessions for Polar payment processing
 */

// Force this route to be dynamic to prevent static generation
export const dynamic = 'force-dynamic';

import { Checkout } from "@polar-sh/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Configure Polar Checkout
export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: process.env.POLAR_SUCCESS_URL!,
});

// POST handler for creating checkout sessions
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { tier } = await req.json();
    
    // Validate tier
    if (!['basic', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Get user from database for proper UUID
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

    // Map tier to product ID (you'll need to get these from your Polar dashboard)
    const productIds = {
      basic: process.env.POLAR_BASIC_PRODUCT_ID,
      pro: process.env.POLAR_PRO_PRODUCT_ID
    };

    const productId = productIds[tier as keyof typeof productIds];

    // Check if product ID is available
    if (!productId || productId === 'your_basic_product_id_here' || productId === 'your_pro_product_id_here') {
      return NextResponse.json(
        { error: `${tier === 'basic' ? 'Basic' : 'Pro'} plan is not available yet. Please contact support.` },
        { status: 503 }
      );
    }

    // Create checkout URL with Polar's expected parameters
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.kyotoscribe.com' 
      : 'http://localhost:3003';
    
    const checkoutUrl = new URL(`${baseUrl}/api/polar/checkout`);
    checkoutUrl.searchParams.set('products', productId);
    checkoutUrl.searchParams.set('customer_email', user.email);
    checkoutUrl.searchParams.set('success_url', process.env.POLAR_SUCCESS_URL!);

    return NextResponse.json({
      url: checkoutUrl.toString(),
      tier,
      userId: user.id
    });

  } catch (error) {
    console.error('Polar checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}