// Stripe Webhook Handler
// Processes Stripe events for subscription management

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { handleWebhookEvent, verifyWebhookSignature } from '../../../../lib/stripe/stripe';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let event: any = null;
  
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    console.log(`🔐 Stripe webhook received - Size: ${body.length} bytes`);

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    try {
      event = verifyWebhookSignature(body, signature);
      console.log(`✅ Webhook signature verified - Event: ${event.type}, ID: ${event.id}`);
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Log the event for debugging
    console.log(`🔄 Processing webhook event: ${event.type} (${event.id})`);

    // Process the webhook event
    await handleWebhookEvent(event);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook processed successfully in ${processingTime}ms - Event: ${event.type} (${event.id})`);

    return NextResponse.json({ 
      received: true,
      eventId: event.id,
      eventType: event.type,
      processingTimeMs: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const eventInfo = event ? `${event.type} (${event.id})` : 'unknown';
    
    console.error(`❌ Webhook processing error after ${processingTime}ms - Event: ${eventInfo}`, error);
    
    if (error instanceof Error && error.message.includes('Stripe not configured')) {
      return NextResponse.json(
        { 
          error: 'Webhook processing not available until Stripe is configured',
          eventId: event?.id,
          eventType: event?.type
        },
        { status: 503 }
      );
    }

    // Return 200 to acknowledge receipt to prevent Stripe retries for non-critical errors
    // Only return 500 for truly unhandleable errors
    if (error instanceof Error) {
      if (error.message.includes('User not found')) {
        console.log(`⚠️ Non-critical error (returning 200 to prevent retries): ${error.message}`);
        return NextResponse.json({ 
          received: true, 
          warning: 'User not found but webhook acknowledged',
          eventId: event?.id,
          eventType: event?.type
        });
      }
    }

    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        eventId: event?.id,
        eventType: event?.type
      },
      { status: 500 }
    );
  }
}

// Health check for webhook endpoint
export async function GET() {
  const { isStripeReady } = await import('../../../../lib/stripe/stripe');
  
  const stripeReady = isStripeReady();
  const webhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
  
  return NextResponse.json({
    status: stripeReady && webhookSecret ? 'ready' : 'not_configured',
    message: stripeReady && webhookSecret 
      ? 'Stripe webhook endpoint is ready to receive events' 
      : 'Stripe webhook endpoint needs configuration',
    details: {
      stripeConfigured: stripeReady,
      webhookSecretConfigured: webhookSecret,
      supportedEvents: [
        'customer.subscription.created',
        'customer.subscription.updated', 
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ]
    },
    timestamp: new Date().toISOString()
  });
}