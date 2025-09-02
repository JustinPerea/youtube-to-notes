import { db } from '../db/connection';
import { users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
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

export async function ensureUserExists(oauthId: string, email: string, name?: string | null, image?: string | null) {
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
    console.error('Error in ensureUserExists:', error);
    throw error;
  }
}

export async function getUserByOAuthId(oauthId: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.oauthId, oauthId),
          eq(users.oauthProvider, 'google')
        )
      )
      .limit(1);

    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error('Error getting user by OAuth ID:', error);
    return null;
  }
}