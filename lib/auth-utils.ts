import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureUserExists } from '@/lib/services/user-service';

export async function getApiSession(request?: NextRequest) {
  try {
    console.log('AUTH-UTILS: Starting session retrieval...');
    
    // Direct session API call - the only reliable method in NextAuth v5
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3003'
      : (process.env.NEXTAUTH_URL?.trim() ||
         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.trim()}` :
         'https://kyotoscribe.com'));
    
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': request?.headers?.get('cookie') || '',
        'Content-Type': 'application/json'
      },
      // Prevent server-side caching from leaking sessions between users
      cache: 'no-store',
      next: { revalidate: 0 },
      credentials: 'include'
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
        userEmail: sessionData?.user?.email,
        userId: sessionData?.user?.id
      });
      
      if (sessionData?.user) {
        return sessionData;
      }
    }
    
    console.log('AUTH-UTILS: Session retrieval failed - no valid session found');
    return null;
  } catch (error: any) {
    console.error('AUTH-UTILS: Session retrieval failed:', error.message);
    return null;
  }
}

export async function getApiSessionWithDatabase(request: NextRequest) {
  try {
    // Prevent execution during build time
    if (process.env.NODE_ENV === 'development' && !request?.headers) {
      console.log('AUTH-UTILS: Skipping auth during build time');
      return null;
    }
    
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
