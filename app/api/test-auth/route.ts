import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('TEST AUTH - Starting auth check...');
    const session = await auth();
    console.log('TEST AUTH - Full session object:', JSON.stringify(session, null, 2));
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
      sessionType: typeof session,
      isArray: Array.isArray(session),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
        authSecretLength: process.env.AUTH_SECRET?.length || 0,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      },
      message: 'Test auth endpoint working',
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
