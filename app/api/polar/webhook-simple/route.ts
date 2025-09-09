/**
 * Simplified Polar Webhook Handler - No Fancy Features, Just Core Functionality
 * Handles subscription events from Polar.sh with minimal complexity
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    console.log('🎯 Simple webhook handler started');
    
    const payload = await req.text();
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
    
    // Basic validation
    if (!webhookSecret) {
      console.error('❌ Missing webhook secret');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }
    
    if (!proProductId) {
      console.error('❌ Missing Pro product ID');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }
    
    // Parse payload
    let event;
    try {
      event = JSON.parse(payload);
      console.log(`🔍 Received event: ${event.type}`);
    } catch (error) {
      console.error('❌ Invalid JSON payload');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    
    // Only handle subscription.active events
    if (event.type !== 'subscription.active') {
      console.log(`⏭️ Skipping event type: ${event.type}`);
      return NextResponse.json({ received: true, skipped: true });
    }
    
    const subscription = event.data;
    const customerEmail = subscription.customer?.email;
    const userEmail = subscription.user?.email;
    const productId = subscription.product_id;
    
    console.log(`🔍 Processing subscription: ${subscription.id}`);
    console.log(`📧 Customer email: ${customerEmail}`);
    console.log(`📧 User email: ${userEmail}`);
    console.log(`📦 Product ID: ${productId}`);
    
    // Find user by email
    let user = null;
    if (customerEmail) {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, customerEmail))
        .limit(1);
      if (result.length > 0) {
        user = result[0];
        console.log(`✅ Found user by customer email: ${user.email}`);
      }
    }
    
    // Try user email if customer email didn't work
    if (!user && userEmail && userEmail !== customerEmail) {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);
      if (result.length > 0) {
        user = result[0];
        console.log(`✅ Found user by user email: ${user.email}`);
      }
    }
    
    if (!user) {
      console.error(`❌ User not found for emails: ${customerEmail}, ${userEmail}`);
      return NextResponse.json({ 
        error: 'User not found',
        customerEmail,
        userEmail 
      }, { status: 404 });
    }
    
    // Determine tier
    const tier = productId === proProductId ? 'pro' : 'free';
    console.log(`🎯 Tier determined: ${tier} (product: ${productId} vs pro: ${proProductId})`);
    
    // Update user - simple direct update, no fancy transactions
    console.log(`💾 Updating user ${user.id} to ${tier} tier`);
    
    await db.update(users)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        polarSubscriptionId: subscription.id,
        polarCustomerId: subscription.customer_id,
        subscriptionCurrentPeriodStart: new Date(subscription.current_period_start),
        subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end),
        paymentProvider: 'polar',
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    console.log(`✅ Successfully updated user ${user.email} to ${tier} tier`);
    
    // Verify update
    const verifyResult = await db
      .select({ 
        email: users.email,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus 
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
      
    if (verifyResult.length > 0) {
      const verified = verifyResult[0];
      console.log(`🔍 Verification: ${verified.email} is now ${verified.subscriptionTier} (${verified.subscriptionStatus})`);
    }
    
    return NextResponse.json({ 
      received: true,
      processed: true,
      userEmail: user.email,
      newTier: tier,
      subscriptionId: subscription.id
    });
    
  } catch (error) {
    console.error('💥 Simple webhook handler failed:', error);
    
    // Return detailed error for debugging
    return NextResponse.json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}