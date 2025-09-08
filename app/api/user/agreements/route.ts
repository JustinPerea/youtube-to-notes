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

    // Get user from database
    const dbUsers = await db
      .select()
      .from(users)
      .where(eq(users.oauthId, session.user.id))
      .limit(1);

    if (dbUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = dbUsers[0];
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

    // Get user agreements status
    const dbUsers = await db
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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