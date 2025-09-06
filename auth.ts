import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Keep database operations minimal in signIn - just verify the user can sign in
      if (account?.provider === 'google' && profile) {
        return true; // Move user creation to API routes for better performance
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account && profile) {
        token.sub = profile.sub || account.providerAccountId;
        token.email = user?.email;
        token.name = user?.name;
        token.picture = user?.image;
      }
      return token;
    },
    async session({ session, token }) {
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
})

// Update the Session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // This will be the OAuth ID
      oauthId?: string; // Optional OAuth ID for reference
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}