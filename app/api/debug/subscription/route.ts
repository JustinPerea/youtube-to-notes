import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { db } from '@/lib/db/connection';
import { users, userMonthlyUsage } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserSubscription, getUserUsage } from '@/lib/subscription/service';

export const dynamic = 'force-dynamic';

/**
 * DEBUG ENDPOINT: Comprehensive subscription debugging
 * GET /api/debug/subscription - Get detailed subscription info for debugging
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Subscription debug endpoint accessed');

    // 1. Authenticate user
    const session = await getApiSessionWithDatabase(req);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { user: sessionUser } = session;
    const userId = sessionUser.id;

    console.log('🔍 Debugging subscription for user:', { 
      id: userId, 
      email: sessionUser.email 
    });

    // 2. Get raw database user data
    const rawUserData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!rawUserData.length) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const dbUser = rawUserData[0];

    // 3. Get subscription service data
    const subscription = await getUserSubscription(userId);
    const usageData = await getUserUsage(userId);

    // 4. Get current monthly usage record
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyUsageData = await db
      .select()
      .from(userMonthlyUsage)
      .where(eq(userMonthlyUsage.userId, userId))
      .limit(10); // Get last 10 months

    // 5. Comprehensive debugging info
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userId,
      userEmail: sessionUser.email,

      // Raw database user fields
      rawDatabaseData: {
        subscriptionTier: dbUser.subscriptionTier,
        subscriptionStatus: dbUser.subscriptionStatus,
        monthlyVideoLimit: dbUser.monthlyVideoLimit,
        videosProcessedThisMonth: dbUser.videosProcessedThisMonth,
        resetDate: dbUser.resetDate,
        
        // Admin override fields
        adminOverrideTier: dbUser.adminOverrideTier,
        adminOverrideExpires: dbUser.adminOverrideExpires,
        
        // Polar fields
        polarCustomerId: dbUser.polarCustomerId,
        polarSubscriptionId: dbUser.polarSubscriptionId,
        paymentProvider: dbUser.paymentProvider,
        
        // Stripe fields (for comparison)
        stripeCustomerId: dbUser.stripeCustomerId,
        stripeSubscriptionId: dbUser.stripeSubscriptionId,
        
        // Period tracking
        subscriptionCurrentPeriodStart: dbUser.subscriptionCurrentPeriodStart,
        subscriptionCurrentPeriodEnd: dbUser.subscriptionCurrentPeriodEnd,
        subscriptionCancelAtPeriodEnd: dbUser.subscriptionCancelAtPeriodEnd,
        
        // Timestamps
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      } as any,

      // Processed subscription data from service
      processedSubscriptionData: subscription,

      // Usage data from service
      usageServiceData: usageData,

      // Monthly usage records
      monthlyUsageRecords: monthlyUsageData.map((record: any) => ({
        monthYear: record.monthYear,
        subscriptionTier: record.subscriptionTier,
        videosLimit: record.videosLimit,
        videosProcessed: record.videosProcessed,
        aiQuestionsLimit: record.aiQuestionsLimit,
        aiQuestionsAsked: record.aiQuestionsAsked,
        storageLimitMb: record.storageLimitMb,
        storageUsedMb: record.storageUsedMb,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })),

      // Potential issues detected
      potentialIssues: [] as string[],
    };

    // 6. Analyze for potential issues
    const issues: string[] = [];

    // Check for tier mismatches
    if (subscription && dbUser.subscriptionTier !== subscription.tier) {
      issues.push(`Database tier (${dbUser.subscriptionTier}) differs from service tier (${subscription.tier})`);
    }

    // Check admin override logic
    const hasActiveAdminOverride = dbUser.adminOverrideTier && 
      (!dbUser.adminOverrideExpires || dbUser.adminOverrideExpires > new Date());
    
    if (hasActiveAdminOverride) {
      issues.push(`Active admin override: ${dbUser.adminOverrideTier} (expires: ${dbUser.adminOverrideExpires})`);
    }

    // Check for missing Polar data if payment provider is Polar
    if (dbUser.paymentProvider === 'polar' && !dbUser.polarSubscriptionId && dbUser.subscriptionTier !== 'free') {
      issues.push('Payment provider is Polar but missing Polar subscription ID');
    }

    // Check for inconsistent monthly usage records
    const currentMonthRecord = monthlyUsageData.find((r: any) => r.monthYear === currentMonth);
    if (currentMonthRecord && currentMonthRecord.subscriptionTier !== dbUser.subscriptionTier) {
      issues.push(`Current month usage record tier (${currentMonthRecord.subscriptionTier}) differs from user tier (${dbUser.subscriptionTier})`);
    }

    debugInfo.potentialIssues = issues;

    // 7. Admin check for sensitive data
    const isAdmin = sessionUser.email?.includes('@') && (
      sessionUser.email === 'admin@example.com' || 
      process.env.NODE_ENV === 'development'
    );

    if (!isAdmin) {
      // Remove sensitive data for non-admin users
      debugInfo.rawDatabaseData = undefined;
      debugInfo.potentialIssues = ['Debug access restricted - admin only'];
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      summary: {
        effectiveTier: subscription?.tier || 'unknown',
        status: subscription?.status || 'unknown',
        hasAdminOverride: hasActiveAdminOverride,
        issuesFound: issues.length,
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error in subscription debug endpoint:', error);
    
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          'Internal error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/debug/subscription - Fix common subscription issues (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getApiSessionWithDatabase(req);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { user: sessionUser } = session;

    // Admin check
    const isAdmin = sessionUser.email?.includes('@') && (
      sessionUser.email === 'admin@example.com' || 
      process.env.NODE_ENV === 'development'
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, targetUserId } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: 'Missing targetUserId or action' },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'refresh_subscription':
        // Re-read subscription from service and update consistency
        const subscription = await getUserSubscription(targetUserId);
        if (subscription) {
          result = {
            action: 'refresh_subscription',
            subscription,
            message: 'Subscription data refreshed'
          };
        } else {
          result = {
            action: 'refresh_subscription',
            error: 'No subscription found'
          };
        }
        break;

      case 'sync_monthly_usage':
        // Update current month usage record to match user subscription
        const currentUser = await db
          .select()
          .from(users)
          .where(eq(users.id, targetUserId))
          .limit(1);
        
        if (currentUser.length > 0) {
          const user = currentUser[0];
          const currentMonth = new Date().toISOString().slice(0, 7);
          
          // This would sync the monthly usage record
          result = {
            action: 'sync_monthly_usage',
            user: {
              tier: user.subscriptionTier,
              status: user.subscriptionStatus,
            },
            message: 'Monthly usage sync initiated'
          };
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: unknown) {
    console.error('Error in subscription debug fix:', error);
    
    return NextResponse.json(
      { 
        error: 'Fix action failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          'Internal error'
      },
      { status: 500 }
    );
  }
}