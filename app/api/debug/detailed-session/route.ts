import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Test both auth methods
    const customSession = await getServerSession(request);
    
    let standardSession = null;
    try {
      standardSession = await auth();
    } catch (authError: any) {
      console.log('Standard auth() failed:', authError.message);
    }

    // Check cookies
    const cookies = request.headers.get('cookie') || '';
    const sessionCookie = request.cookies.get('__Secure-next-auth.session-token') || 
                         request.cookies.get('next-auth.session-token');

    return NextResponse.json({
      success: true,
      customSession: {
        hasSession: !!customSession,
        hasUser: !!customSession?.user,
        userId: customSession?.user?.id,
        userEmail: customSession?.user?.email,
      },
      standardSession: {
        hasSession: !!standardSession,
        hasUser: !!standardSession?.user,
        userId: standardSession?.user?.id,
        userEmail: standardSession?.user?.email,
      },
      cookies: {
        hasCookieHeader: !!cookies,
        cookieLength: cookies.length,
        hasSessionCookie: !!sessionCookie,
        sessionCookieName: sessionCookie?.name,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        VERCEL_URL: process.env.VERCEL_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.substring(0, 500),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}