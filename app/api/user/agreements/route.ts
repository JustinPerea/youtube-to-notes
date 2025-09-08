import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      tosAccepted,
      privacyAccepted,
      marketingConsent,
      ageVerified
    } = await req.json();

    // Validate required fields
    if (!tosAccepted || !privacyAccepted || !ageVerified) {
      return NextResponse.json(
        { error: 'Terms of Service, Privacy Policy, and age verification are required' },
        { status: 400 }
      );
    }

    // Get user from database or create if not exists
    let dbUsers = await db
      .select()
      .from(users)
      .where(eq(users.oauthId, session.user.id))
      .limit(1);

    let user;
    if (dbUsers.length === 0) {
      // Create user if they don't exist
      const newUserData = {
        email: session.user.email!,
        name: session.user.name || null,
        image: session.user.image || null,
        oauthId: session.user.id,
        oauthProvider: 'google',
        emailVerified: new Date(),
      };

      const createdUsers = await db
        .insert(users)
        .values(newUserData)
        .returning();
      
      user = createdUsers[0];
    } else {
      user = dbUsers[0];
    }
    const now = new Date();
    const currentVersion = '1.0'; // Update this when you change T&C

    // Update user agreements
    await db
      .update(users)
      .set({
        tosAccepted: true,
        tosAcceptedAt: now,
        tosAcceptedVersion: currentVersion,
        privacyAccepted: true,
        privacyAcceptedAt: now,
        privacyAcceptedVersion: currentVersion,
        marketingConsent: marketingConsent || false,
        marketingConsentAt: marketingConsent ? now : null,
        ageVerified: true,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        updatedAt: now
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'Agreements updated successfully'
    });

  } catch (error) {
    console.error('Error updating user agreements:', error);
    return NextResponse.json(
      { error: 'Failed to update agreements' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user agreements status, create user if they don't exist
    let dbUsers = await db
      .select({
        tosAccepted: users.tosAccepted,
        tosAcceptedAt: users.tosAcceptedAt,
        tosAcceptedVersion: users.tosAcceptedVersion,
        privacyAccepted: users.privacyAccepted,
        privacyAcceptedAt: users.privacyAcceptedAt,
        privacyAcceptedVersion: users.privacyAcceptedVersion,
        marketingConsent: users.marketingConsent,
        marketingConsentAt: users.marketingConsentAt,
        ageVerified: users.ageVerified,
        onboardingCompleted: users.onboardingCompleted,
        onboardingCompletedAt: users.onboardingCompletedAt
      })
      .from(users)
      .where(eq(users.oauthId, session.user.id))
      .limit(1);

    if (dbUsers.length === 0) {
      // Create user if they don't exist and return default values
      const newUserData = {
        email: session.user.email!,
        name: session.user.name || null,
        image: session.user.image || null,
        oauthId: session.user.id,
        oauthProvider: 'google',
        emailVerified: new Date(),
      };

      await db.insert(users).values(newUserData);

      // Return default agreement values for new user
      return NextResponse.json({
        agreements: {
          tosAccepted: false,
          tosAcceptedAt: null,
          tosAcceptedVersion: null,
          privacyAccepted: false,
          privacyAcceptedAt: null,
          privacyAcceptedVersion: null,
          marketingConsent: false,
          marketingConsentAt: null,
          ageVerified: false,
          onboardingCompleted: false,
          onboardingCompletedAt: null
        }
      });
    }

    return NextResponse.json({
      agreements: dbUsers[0]
    });

  } catch (error) {
    console.error('Error fetching user agreements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agreements' },
      { status: 500 }
    );
  }
}