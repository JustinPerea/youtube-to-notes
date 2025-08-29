# Claude Opus Authentication Debug Prompt

## Problem Description
We have a Next.js application with NextAuth v5 and Supabase database that's experiencing authentication issues on Vercel deployment. The session shows `"idType":"undefined"` and users get "Unauthorized. Please sign in." when trying to save notes or access "My Notes" page.

## Current Status
- **Local Environment**: Authentication works perfectly, session has valid UUID
- **Vercel Deployment**: Session shows `"idType":"undefined"`, causing authorization failures
- **Database**: Supabase PostgreSQL with Transaction Pooler
- **Auth Provider**: Google OAuth

## Environment Variables (Vercel)
```
AUTH_SECRET=Set
NEXTAUTH_SECRET=Set
GOOGLE_CLIENT_ID=Set
GOOGLE_CLIENT_SECRET=Set
AUTH_URL=Set
VERCEL_URL=Set
DATABASE_URL=postgresql://postgres.guuxhmfzimnryzusjykm:wWaWjFSekzqrSIam@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Current Code

### lib/auth.ts
```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "./db/connection";
import { users } from "./db/schema";
import { eq, and } from "drizzle-orm";
import crypto from 'crypto';

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile) {
        try {
          // Ensure user exists in database
          await getOrCreateUser(
            profile.sub || account.providerAccountId,
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
          // Fallback: generate a consistent UUID from OAuth ID
          session.user.id = generateUUIDFromOAuthId(token.sub);
          session.user.oauthId = token.sub;
        }
      } else if (session.user && token.sub) {
        // Fallback for cases where database is not available
        session.user.id = generateUUIDFromOAuthId(token.sub);
        session.user.oauthId = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (account && profile) {
        token.sub = profile.sub || account.providerAccountId; // Store OAuth ID in token
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
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});

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
```

### lib/db/connection.ts
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, notes } from './schema';

let postgresClient: postgres.Sql | null = null;
let drizzleInstance: ReturnType<typeof drizzle> | null = null;

export async function createDatabaseConnection() {
  if (postgresClient && drizzleInstance) {
    return { postgresClient, db: drizzleInstance };
  }

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('DATABASE_URL not set, skipping database connection');
    return { postgresClient: null, db: null };
  }

  try {
    console.log('Attempting database connection with:', databaseUrl.replace(/:[^:@]*@/, ':***@'));
    
    postgresClient = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: 'require',
      prepare: false
    });

    drizzleInstance = drizzle(postgresClient);
    
    console.log('Database connection established successfully');
    
    return { postgresClient, db: drizzleInstance };
  } catch (error) {
    console.error('Failed to establish database connection:', error);
    postgresClient = null;
    drizzleInstance = null;
    return { postgresClient: null, db: null };
  }
}

export async function checkDatabaseConnection() {
  const { db } = await createDatabaseConnection();
  
  if (!db) {
    return {
      success: false,
      error: 'Database connection not configured'
    };
  }

  try {
    await db.select().from(users).limit(1);
    return {
      success: true,
      database: 'connected',
      pooler: 'active'
    };
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    
    if (error.code === '28P01') {
      return {
        success: false,
        error: 'Password authentication failed for user "postgres"',
        database: 'error',
        pooler: 'error'
      };
    } else if (error.message?.includes('Tenant or user not found')) {
      return {
        success: false,
        error: 'Tenant or user not found. Please check your Supabase configuration.',
        database: 'error',
        pooler: 'error'
      };
    } else {
      return {
        success: false,
        error: 'Connection failed',
        database: 'error',
        pooler: 'error'
      };
    }
  }
}

export async function closeDatabaseConnection() {
  if (postgresClient) {
    await postgresClient.end();
    postgresClient = null;
    drizzleInstance = null;
  }
}

export const db = drizzleInstance as any;
```

### app/api/notes/save/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotesService } from '@/lib/services/notes';
import { apiRateLimiter, getClientIdentifier, applyRateLimit, validateNoteData } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await applyRateLimit(apiRateLimiter, clientId);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // Validate note data
    const body = await request.json();
    const validationResult = validateNoteData(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    const sanitizedData = validationResult.data;

    // Get user session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    console.log('Session in save route:', {
      user: {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        id: session.user.id
      }
    });

    // Save note
    const result = await NotesService.saveNote({
      userId: session.user.id,
      videoId: sanitizedData.videoId,
      title: sanitizedData.title,
      content: sanitizedData.content,
      templateId: sanitizedData.templateId,
      tags: sanitizedData.tags,
    });

    if (!result.success) {
      console.error('Error saving note:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      noteId: result.noteId,
      message: 'Note saved successfully'
    });

  } catch (error) {
    console.error('Error in save note API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### lib/services/notes.ts
```typescript
import { db } from '@/lib/db/connection';
import { notes, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const NotesService = {
  async saveNote(data: {
    userId: string;
    videoId: string;
    title: string;
    content: string;
    templateId: string;
    tags?: string[];
  }) {
    if (!db) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      console.log('Saving note with userId:', data.userId);

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(data.userId)) {
        return { success: false, error: `Invalid user ID format. Expected UUID, got: ${data.userId}` };
      }

      // Save the note
      const result = await db
        .insert(notes)
        .values({
          userId: data.userId,
          videoId: data.videoId,
          title: data.title,
          content: data.content,
          templateId: data.templateId,
          tags: data.tags || [],
        })
        .returning();

      return {
        success: true,
        noteId: result[0].id,
        message: 'Note saved successfully'
      };
    } catch (error: any) {
      console.error('Error saving note:', error);

      // Handle specific database errors
      if (error.code === '23503') {
        return { success: false, error: 'User not found. Please sign in again.' };
      }

      return { success: false, error: error.message || 'Failed to save note' };
    }
  },

  async getNotes(userId: string, filters?: {
    templateId?: string;
    videoId?: string;
    search?: string;
  }) {
    if (!db) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      let query = db.select().from(notes).where(eq(notes.userId, userId));

      if (filters?.templateId) {
        query = query.where(and(eq(notes.userId, userId), eq(notes.templateId, filters.templateId)));
      }

      if (filters?.videoId) {
        query = query.where(and(eq(notes.userId, userId), eq(notes.videoId, filters.videoId)));
      }

      const result = await query.orderBy(desc(notes.createdAt));

      return {
        success: true,
        notes: result
      };
    } catch (error: any) {
      console.error('Error getting notes:', error);
      return { success: false, error: error.message || 'Failed to get notes' };
    }
  },

  async deleteNote(noteId: string, userId: string) {
    if (!db) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const result = await db
        .delete(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
        .returning();

      if (result.length === 0) {
        return { success: false, error: 'Note not found or unauthorized' };
      }

      return {
        success: true,
        message: 'Note deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting note:', error);
      return { success: false, error: error.message || 'Failed to delete note' };
    }
  }
};
```

### app/api/auth/test/route.ts
```typescript
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
```

## Database Schema

### lib/db/schema.ts
```typescript
import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  oauthId: text('oauth_id'),
  oauthProvider: text('oauth_provider').default('google'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  videoId: text('video_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  templateId: text('template_id').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

## Current Debug Output

### Auth Test Endpoint Response
```json
{
  "auth": {
    "secret": "Set",
    "nexAuthSecret": "Set", 
    "googleClientId": "Set",
    "googleClientSecret": "Set",
    "authUrl": "Set",
    "vercelUrl": "Set"
  },
  "session": {
    "hasSession": true,
    "user": {
      "idType": "undefined"
    }
  },
  "environment": "production",
  "timestamp": "2025-08-29T18:44:39.431Z"
}
```

## Previous Attempts

1. **Added fallback UUID generation** - Created `generateUUIDFromOAuthId` function
2. **Updated session callback** - Added try/catch with fallback mechanism
3. **Verified environment variables** - All auth variables are set correctly
4. **Checked database connection** - Database connection is working
5. **Verified OAuth flow** - Google Sign-In works, session is created

## Key Observations

1. **Local vs Vercel**: Local environment works perfectly, Vercel shows `idType: "undefined"`
2. **Session vs Database**: Session exists but user ID is undefined
3. **Database Connection**: Working correctly on both environments
4. **OAuth Flow**: Working correctly, user can sign in

## Questions for Claude Opus

1. **Why is the session callback not setting the user ID on Vercel?**
2. **Is there a difference in how NextAuth handles sessions in production vs development?**
3. **Could this be related to the JWT session strategy or token handling?**
4. **Are there any Vercel-specific environment variables or configurations needed?**
5. **Could this be related to the database connection timing or async handling?**
6. **Should we implement a different session strategy or fallback mechanism?**
7. **Could this be related to the NextAuth v5 beta version we're using?**

## Request

Please analyze the code and provide:
1. **Root cause analysis** of why the session user ID is undefined on Vercel
2. **Specific fixes** to implement
3. **Alternative approaches** if the current approach isn't working
4. **Testing strategy** to verify the fix works

The goal is to ensure that `session.user.id` is properly set on Vercel deployment so users can save and access their notes.
