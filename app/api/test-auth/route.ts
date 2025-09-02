import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('TEST AUTH - Starting auth check...');
    
    // Try different import approaches
    let session1, session2, session3;
    
    try {
      // Method 1: Direct auth import
      const { auth } = await import('@/lib/auth');
      session1 = await auth();
      console.log('TEST AUTH - Direct auth() result:', typeof session1, session1);
    } catch (e: any) {
      console.log('TEST AUTH - Direct auth() error:', e.message);
    }

    try {
      // Method 2: Auth with proper request context
      const { auth } = await import('@/lib/auth');
      // For NextAuth v5, we might need to pass request/response
      session2 = await auth();
      console.log('TEST AUTH - Context auth() result:', typeof session2, session2);
    } catch (e: any) {
      console.log('TEST AUTH - Context auth() error:', e.message);
    }

    try {
      // Method 3: Try the working session endpoint approach with detailed debugging
      const baseUrl = process.env.NEXTAUTH_URL?.trim() || 'https://kyotoscribe.com';
      const fetchUrl = `${baseUrl}/api/auth/session`;
      const cookieHeader = request.headers.get('cookie') || '';
      
      console.log('TEST AUTH - Fetch details:', {
        baseUrl,
        fetchUrl,
        hasCookies: !!cookieHeader,
        cookieLength: cookieHeader.length,
        cookiePreview: cookieHeader.substring(0, 100)
      });
      
      const sessionResponse = await fetch(fetchUrl, {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': request.headers.get('user-agent') || '',
        }
      });
      
      console.log('TEST AUTH - Fetch response:', {
        status: sessionResponse.status,
        statusText: sessionResponse.statusText,
        ok: sessionResponse.ok,
        headers: Object.fromEntries(sessionResponse.headers.entries())
      });
      
      if (sessionResponse.ok) {
        const responseText = await sessionResponse.text();
        console.log('TEST AUTH - Response text:', responseText);
        
        try {
          session3 = JSON.parse(responseText);
          console.log('TEST AUTH - Parsed session:', typeof session3, session3);
        } catch (parseError) {
          console.log('TEST AUTH - JSON parse error:', parseError);
          session3 = { error: 'JSON parse failed', rawResponse: responseText };
        }
      } else {
        const errorText = await sessionResponse.text();
        console.log('TEST AUTH - Error response:', errorText);
        session3 = { error: 'HTTP error', status: sessionResponse.status, response: errorText };
      }
    } catch (e: any) {
      console.log('TEST AUTH - Session API error:', e.message);
      session3 = { error: e.message };
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
        rawValue: session1, // Show the actual corrupted value
      },
      session2: {
        hasSession: !!session2,
        type: typeof session2,
        isArray: Array.isArray(session2),
        keys: session2 ? Object.keys(session2) : [],
        hasUser: !!session2?.user,
        rawValue: session2,
      },
      session3: {
        hasSession: !!session3,
        type: typeof session3,
        isArray: Array.isArray(session3),
        keys: session3 ? Object.keys(session3) : [],
        hasUser: !!session3?.user,
        rawValue: session3, // This should be the working one
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      },
      recommendation: session3 ? 'Use session3 approach (fetch API)' : 'All methods failed',
      message: 'Testing all auth approaches',
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
