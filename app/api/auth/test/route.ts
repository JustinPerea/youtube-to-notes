import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    
    return NextResponse.json({
      auth: {
        secret: process.env.AUTH_SECRET ? 'Set' : 'Not set',
        nexAuthSecret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
        googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
        authUrl: process.env.AUTH_URL ? 'Set' : 'Not set',
        vercelUrl: process.env.VERCEL_URL ? 'Set' : 'Not set',
      },
      session: {
        hasSession: !!session,
        user: session ? {
          name: session.user?.name,
          email: session.user?.email,
          id: session.user?.id,
          idType: typeof session.user?.id
        } : null,
        expires: session?.expires
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in auth test API:', error);
    return NextResponse.json({
      error: 'Session check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
