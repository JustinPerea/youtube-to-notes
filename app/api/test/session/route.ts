import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        user: {
          name: session.user?.name,
          email: session.user?.email,
          id: session.user?.id,
          idType: typeof session.user?.id
        },
        expires: session.expires
      } : null,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Error in session test API:', error);
    return NextResponse.json({
      error: 'Session check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
