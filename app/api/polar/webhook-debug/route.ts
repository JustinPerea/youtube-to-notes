import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * DEBUG WEBHOOK ENDPOINT
 * Logs everything Polar sends to help debug webhook issues
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    
    console.log('🔍 POLAR WEBHOOK DEBUG - Full Request Details:');
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Payload:', payload);
    console.log('Payload length:', payload.length);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Check specific headers Polar might send
    const signature = req.headers.get('polar-signature') || 
                     req.headers.get('x-polar-signature') ||
                     req.headers.get('signature');
    
    console.log('🔍 Signature analysis:');
    console.log('polar-signature header:', req.headers.get('polar-signature'));
    console.log('x-polar-signature header:', req.headers.get('x-polar-signature'));
    console.log('signature header:', req.headers.get('signature'));
    console.log('Found signature:', signature);
    
    // Try to parse payload
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
      console.log('✅ Payload successfully parsed as JSON');
      console.log('Event type:', parsedPayload.type);
      console.log('Event data keys:', Object.keys(parsedPayload.data || {}));
    } catch (e) {
      console.log('❌ Failed to parse payload as JSON:', e);
    }
    
    // Always return success for debugging
    return NextResponse.json({
      success: true,
      message: 'Webhook received and logged',
      timestamp: new Date().toISOString(),
      signatureFound: !!signature,
      payloadParsed: !!parsedPayload,
      eventType: parsedPayload?.type || 'unknown'
    }, { status: 200 });
    
  } catch (error) {
    console.error('🔍 DEBUG WEBHOOK ERROR:', error);
    
    return NextResponse.json({
      error: 'Debug webhook failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}