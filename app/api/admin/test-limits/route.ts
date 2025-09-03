/**
 * Admin API for testing subscription limits automatically
 * Simulates usage without actually processing videos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { checkUsageLimit, incrementUsage, getUserUsage } from '@/lib/subscription/service';
import { db } from '@/lib/db/connection';
import { users, userMonthlyUsage } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function isAdmin(email?: string | null): Promise<boolean> {
  return process.env.NODE_ENV === 'development' || email === 'justinmperea@gmail.com';
}

async function ensureUserExists(sessionUser: { id: string; email: string; name?: string; image?: string }) {
  try {
    let existingUser = await db
      .select()
      .from(users)
      .where(eq(users.oauthId, sessionUser.id))
      .limit(1);

    if (existingUser.length > 0) {
      return existingUser[0].id;
    }

    existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, sessionUser.email))
      .limit(1);

    if (existingUser.length > 0) {
      await db
        .update(users)
        .set({
          oauthId: sessionUser.id,
          oauthProvider: 'google',
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id));
      
      return existingUser[0].id;
    }

    const newUser = await db
      .insert(users)
      .values({
        email: sessionUser.email,
        name: sessionUser.name,
        image: sessionUser.image,
        oauthId: sessionUser.id,
        oauthProvider: 'google',
        subscriptionTier: 'free',
      })
      .returning();

    return newUser[0].id;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

// POST /api/admin/test-limits - Run automated limit tests
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const dbUserId = await ensureUserExists({
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name,
      image: session.user.image
    });

    const { testType } = await req.json();

    const results = {
      testType,
      userId: dbUserId,
      testResults: [] as any[],
      finalUsage: null as any,
      success: true,
      message: ''
    };

    if (testType === 'video_limits') {
      // Test video processing limits
      console.log('🧪 Testing video processing limits...');
      
      for (let i = 1; i <= 7; i++) {
        console.log(`🧪 Test ${i}: Checking limit for user ${dbUserId}`);
        const limitCheck = await checkUsageLimit(dbUserId, 'process_video');
        console.log(`🧪 Test ${i} result:`, limitCheck);
        
        const testResult = {
          attempt: i,
          beforeUsage: limitCheck.current || 0,
          allowed: limitCheck.allowed,
          limit: limitCheck.limit,
          remaining: limitCheck.remaining,
          unlimited: limitCheck.unlimited,
          reason: limitCheck.reason
        };

        if (limitCheck.allowed) {
          // Simulate processing a video by incrementing usage
          await incrementUsage(dbUserId, 'process_video');
          testResult.action = 'Video processed (simulated)';
        } else {
          testResult.action = 'Blocked - limit reached';
        }

        results.testResults.push(testResult);
        
        console.log(`Video ${i}: ${testResult.action} - ${testResult.beforeUsage}/${testResult.limit || 'unlimited'}`);
      }

      results.message = 'Video limit test completed. Check if 6th and 7th videos were blocked.';

    } else if (testType === 'ai_limits') {
      // Test AI chat limits
      console.log('🧪 Testing AI chat limits...');
      
      for (let i = 1; i <= 12; i++) {
        const limitCheck = await checkUsageLimit(dbUserId, 'ask_ai_question');
        const testResult = {
          attempt: i,
          beforeUsage: limitCheck.current || 0,
          allowed: limitCheck.allowed,
          limit: limitCheck.limit,
          remaining: limitCheck.remaining,
          unlimited: limitCheck.unlimited,
          reason: limitCheck.reason
        };

        if (limitCheck.allowed) {
          await incrementUsage(dbUserId, 'ask_ai_question');
          testResult.action = 'AI question processed (simulated)';
        } else {
          testResult.action = 'Blocked - limit reached or disabled';
        }

        results.testResults.push(testResult);
        
        console.log(`AI Q${i}: ${testResult.action} - ${testResult.beforeUsage}/${testResult.limit || 'unlimited'}`);
      }

      results.message = 'AI chat limit test completed. Check if limits are enforced correctly.';

    } else if (testType === 'reset_usage') {
      // Reset usage for testing
      console.log('🧪 Resetting usage counters...');
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      await db
        .delete(userMonthlyUsage)
        .where(
          and(
            eq(userMonthlyUsage.userId, dbUserId),
            eq(userMonthlyUsage.monthYear, currentMonth)
          )
        );

      results.message = 'Usage counters reset. You can now test limits from zero.';
      results.testResults.push({
        action: 'Usage reset',
        message: 'All monthly usage counters cleared'
      });
    }

    // Get final usage data
    results.finalUsage = await getUserUsage(dbUserId);

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error running limit tests:', error);
    return NextResponse.json({
      error: 'Failed to run limit tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}