import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * TEMPORARY: Permissive webhook to debug signature issues
 * This accepts ANY webhook and logs what Polar actually sends
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    
    console.log('🔍 POLAR WEBHOOK TEST - What Polar actually sends:');
    console.log('='.repeat(60));
    console.log('Headers:');
    
    // Log all headers that might contain signatures
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase().includes('signature') || 
          key.toLowerCase().includes('polar') ||
          key.toLowerCase().includes('webhook')) {
        console.log(`  ${key}: ${headers[key]}`);
      }
    });
    
    console.log('\nPayload (first 200 chars):', payload.substring(0, 200));
    console.log('Payload length:', payload.length);
    
    // Try to parse as JSON
    try {
      const event = JSON.parse(payload);
      console.log('Event type:', event.type);
      console.log('Event ID:', event.id || 'no ID');
    } catch (e) {
      console.log('❌ Could not parse payload as JSON');
    }
    
    console.log('='.repeat(60));
    
    // Always return success
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received - check logs',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🔍 Test webhook error:', error);
    return NextResponse.json({ 
      error: 'Test webhook failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}