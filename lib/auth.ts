import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db/connection";
import { users } from "./db/schema";
import { eq, and } from "drizzle-orm";

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

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Ensure user exists in database
          await getOrCreateUser(
            account.providerAccountId,
            user.email!,
            user.name,
            user.image
          );
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        try {
          // Get user from database using OAuth ID
          const dbUser = await getOrCreateUser(
            token.sub,
            session.user.email!,
            session.user.name,
            session.user.image
          );
          
          // Add database UUID to session
          session.user.id = dbUser.id; // This is now the UUID from database
          session.user.oauthId = dbUser.oauthId; // Keep OAuth ID for reference if needed
        } catch (error) {
          console.error('Error in session callback:', error);
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.sub = account.providerAccountId; // Store OAuth ID in token
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

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
