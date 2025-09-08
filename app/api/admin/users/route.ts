import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to view all user subscriptions
 * GET /api/admin/users - List all users and their subscription tiers
 */
export async function GET(req: NextRequest) {
  try {
    const { user } = await getApiSessionWithDatabase(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Admin check
    const isAdmin = user.email?.includes('@') && (
      user.email === 'admin@example.com' || 
      user.email?.endsWith('@gmail.com') || 
      process.env.NODE_ENV === 'development'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('👤 Admin user listing requested by:', user.email);

    // Get all users
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
        paymentProvider: users.paymentProvider,
        polarCustomerId: users.polarCustomerId,
        polarSubscriptionId: users.polarSubscriptionId,
        adminOverrideTier: users.adminOverrideTier,
        adminOverrideExpires: users.adminOverrideExpires,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    // Process and count
    const tierCounts = { free: 0, basic: 0, pro: 0, admin_override: 0 };
    
    const processedUsers = allUsers.map((user: any) => {
      const hasActiveAdminOverride = user.adminOverrideTier && 
        (!user.adminOverrideExpires || user.adminOverrideExpires > new Date());
      
      const effectiveTier = hasActiveAdminOverride ? user.adminOverrideTier : user.subscriptionTier;
      
      // Count
      if (hasActiveAdminOverride) {
        tierCounts.admin_override++;
      } else {
        tierCounts[effectiveTier as keyof typeof tierCounts]++;
      }
      
      return {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        effectiveTier,
        hasAdminOverride: hasActiveAdminOverride,
        adminOverrideTier: user.adminOverrideTier,
        adminOverrideExpires: user.adminOverrideExpires,
        paymentProvider: user.paymentProvider,
        hasPolarSub: !!user.polarSubscriptionId,
        createdAt: user.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: allUsers.length,
        tierCounts,
        paidUsers: tierCounts.basic + tierCounts.pro,
      },
      users: processedUsers,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : 
          undefined
      },
      { status: 500 }
    );
  }
}