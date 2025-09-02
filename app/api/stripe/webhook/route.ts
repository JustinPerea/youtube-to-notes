// Stripe Webhook Handler
// Processes Stripe events for subscription management

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { handleWebhookEvent, verifyWebhookSignature } from '../../../../lib/stripe/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Process the webhook event
    await handleWebhookEvent(event);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    if (error instanceof Error && error.message.includes('Stripe not configured')) {
      return NextResponse.json(
        { error: 'Webhook processing not available until Stripe is configured' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'webhook_endpoint_active',
    message: 'Stripe webhook endpoint is ready to receive events',
  });
}