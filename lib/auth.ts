import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "./db/connection";
import { users } from "./db/schema";
import { eq, and } from "drizzle-orm";
import crypto from 'crypto';
import type { NextRequest } from 'next/server';

// Helper function to generate a consistent UUID from OAuth ID
function generateUUIDFromOAuthId(oauthId: string): string {
  // Create a hash of the OAuth ID
  const hash = crypto.createHash('sha256').update(oauthId).digest();
  
  // Use the first 16 bytes to create a UUID v5-like structure
  const uuid = [
    hash.toString('hex').slice(0, 8),
    hash.toString('hex').slice(8, 12),
    hash.toString('hex').slice(12, 16),
    hash.toString('hex').slice(16, 20),
    hash.toString('hex').slice(20, 32)
  ].join('-');
  
  return uuid;
}

// Helper function to get or create user
async function getOrCreateUser(oauthId: string, email: string, name?: string | null, image?: string | null) {
  try {
    // First, try to find user by OAuth ID
    const existingUser = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.oauthId, oauthId),
          eq(users.oauthProvider, 'google')
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      // Update user info if changed
      const user = existingUser[0];
      if (user.email !== email || user.name !== name || user.image !== image) {
        await db
          .update(users)
          .set({
            email,
            name,
            image,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        
        return { ...user, email, name, image };
      }
      return user;
    }

    // Check if user exists with same email (might be migrating from old system)
    const existingEmailUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmailUser.length > 0) {
      // Update existing user with OAuth info
      const user = existingEmailUser[0];
      await db
        .update(users)
        .set({
          oauthId,
          oauthProvider: 'google',
          name: name || user.name,
          image: image || user.image,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      
      return { ...user, oauthId, oauthProvider: 'google' };
    }

    // Create new user - handle duplicate email error gracefully
    try {
      const newUser = await db
        .insert(users)
        .values({
          email,
          name,
          image,
          oauthId,
          oauthProvider: 'google',
        })
        .returning();

      return newUser[0];
    } catch (insertError: any) {
      // If insert failed due to duplicate email, try to find the user again
      if (insertError.code === '23505' && insertError.detail?.includes('email')) {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        
        if (user.length > 0) {
          // Update the existing user with OAuth info
          await db
            .update(users)
            .set({
              oauthId,
              oauthProvider: 'google',
              updatedAt: new Date(),
            })
            .where(eq(users.id, user[0].id));
          
          return { ...user[0], oauthId, oauthProvider: 'google' };
        }
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
}

// Simplified configuration without problematic satisfies pattern
const config = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Keep database operations minimal in signIn - just verify the user can sign in
      if (account?.provider === 'google' && profile) {
        return true; // Move user creation to API routes for better performance
      }
      return true;
    },
    async jwt({ token, user, account, profile }: any) {
      if (account && profile) {
        token.sub = profile.sub || account.providerAccountId;
        token.email = user?.email;
        token.name = user?.name;
        token.picture = user?.image;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Minimal session callback - avoid database calls for performance
      if (session.user && token.sub) {
        session.user.id = token.sub; // Use OAuth ID directly in session
        session.user.oauthId = token.sub;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

// Helper function to safely get session in API routes
export async function getServerSession(req?: NextRequest) {
  try {
    // Use the standard NextAuth auth() function
    const session = await auth();
    return session;
  } catch (error: any) {
    console.error('Error in getServerSession:', error);
    return null;
  }
}

// Update the Session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // This will be the UUID from database
      oauthId?: string; // Optional OAuth ID for reference
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
