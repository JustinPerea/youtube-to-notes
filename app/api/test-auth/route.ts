import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('TEST AUTH - Starting auth check...');
    
    // Try different ways to get the session
    let session1, session2, session3;
    
    try {
      session1 = await auth();
      console.log('TEST AUTH - auth() result:', typeof session1, session1);
    } catch (e: any) {
      console.log('TEST AUTH - auth() error:', e.message);
    }

    try {
      // Try with request context (NextAuth v5 approach)
      const req = {
        headers: request.headers,
        cookies: request.cookies,
        url: request.url,
      };
      session2 = await auth();
      console.log('TEST AUTH - auth() with context result:', typeof session2, session2);
    } catch (e: any) {
      console.log('TEST AUTH - auth() with context error:', e.message);
    }
    
    const session = session1 || session2;
    
    return NextResponse.json({
      success: true,
      session1: {
        hasSession: !!session1,
        type: typeof session1,
        isArray: Array.isArray(session1),
        keys: session1 ? Object.keys(session1) : [],
        hasUser: !!session1?.user,
      },
      session2: {
        hasSession: !!session2,
        type: typeof session2,
        isArray: Array.isArray(session2),
        keys: session2 ? Object.keys(session2) : [],
        hasUser: !!session2?.user,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
        authSecretLength: process.env.AUTH_SECRET?.length || 0,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      },
      message: 'Test auth endpoint working - multiple approaches',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('TEST AUTH - Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Test auth endpoint failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}// Force redeploy Tue Sep  2 16:59:59 EDT 2025
