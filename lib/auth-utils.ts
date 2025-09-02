import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureUserExists } from '@/lib/services/user-service';

export async function getApiSession(request: NextRequest) {
  try {
    console.log('AUTH-UTILS: Starting session retrieval...');
    
    // Primary approach: Try NextAuth auth()
    const session = await auth();
    console.log('AUTH-UTILS: auth() result:', {
      type: typeof session,
      isObject: typeof session === 'object' && session !== null,
      hasUser: session && typeof session === 'object' && 'user' in session,
    });
    
    // Check if it's actually a session object, not a string
    if (session && typeof session === 'object' && session !== null && 'user' in session && session.user) {
      console.log('AUTH-UTILS: Valid session from auth(), user:', session.user.email);
      return session;
    }
    
    console.log('AUTH-UTILS: auth() failed, trying fallback...');
    
    // Fallback: Direct session API call
    const baseUrl = process.env.NEXTAUTH_URL?.trim() || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.trim()}` : 
                   'https://kyotoscribe.com');
    
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });
    
    console.log('AUTH-UTILS: Session API response:', {
      status: sessionResponse.status,
      statusText: sessionResponse.statusText,
      ok: sessionResponse.ok
    });
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('AUTH-UTILS: Session API data:', {
        hasUser: !!sessionData?.user,
        userEmail: sessionData?.user?.email
      });
      
      if (sessionData?.user) {
        return sessionData;
      }
    }
    
    console.log('AUTH-UTILS: All authentication methods failed');
    return null;
  } catch (error: any) {
    console.error('AUTH-UTILS: Session retrieval failed:', error.message);
    return null;
  }
}

export async function getApiSessionWithDatabase(request: NextRequest) {
  try {
    const session = await getApiSession(request);
    
    if (!session?.user?.oauthId) {
      return null;
    }
    
    // Ensure user exists in database and get database UUID
    const dbUser = await ensureUserExists(
      session.user.oauthId,
      session.user.email!,
      session.user.name,
      session.user.image
    );
    
    // Return session with database user ID
    return {
      ...session,
      user: {
        ...session.user,
        id: dbUser.id, // Database UUID
        oauthId: session.user.oauthId, // OAuth ID for reference
      }
    };
  } catch (error: any) {
    console.error('AUTH-UTILS: Database session creation failed:', error.message);
    return null;
  }
}