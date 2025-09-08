import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionWithDatabase } from '../../../../lib/auth-utils';
import { setAdminOverride, clearAdminOverride } from '../../../../lib/subscription/service';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to temporarily override subscription tier for testing
 * GET /api/admin/test-tier - Get current override
 * POST /api/admin/test-tier - Set override { tier: 'free' | 'basic' | 'pro', hours?: number }
 * DELETE /api/admin/test-tier - Clear override
 */

export async function GET(req: NextRequest) {
  try {
    const { user } = await getApiSessionWithDatabase(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Simple admin check - in production, you'd check against admin user IDs
    const isAdmin = user.email?.includes('@') && (
      user.email === 'admin@example.com' || 
      process.env.NODE_ENV === 'development'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Return current admin override status
    return NextResponse.json({
      userId: user.id,
      adminOverrideTier: user.adminOverrideTier,
      adminOverrideExpires: user.adminOverrideExpires,
      currentTier: user.subscriptionTier,
      message: 'Current admin override status'
    });

  } catch (error) {
    console.error('Error getting admin tier override:', error);
    return NextResponse.json(
      { error: 'Failed to get override status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getApiSessionWithDatabase(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Simple admin check - in production, you'd check against admin user IDs
    const isAdmin = user.email?.includes('@') && (
      user.email === 'admin@example.com' || 
      process.env.NODE_ENV === 'development'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { tier, hours = 24 } = body;

    if (!tier || !['free', 'basic', 'pro'].includes(tier)) {
      return NextResponse.json({ 
        error: 'Invalid tier. Must be free, basic, or pro' 
      }, { status: 400 });
    }

    await setAdminOverride(user.id, tier, hours);

    return NextResponse.json({
      success: true,
      message: `Admin override set: ${tier} tier for ${hours} hours`,
      userId: user.id,
      tier,
      expiresInHours: hours
    });

  } catch (error) {
    console.error('Error setting admin tier override:', error);
    return NextResponse.json(
      { error: 'Failed to set admin override' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await getApiSessionWithDatabase(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Simple admin check - in production, you'd check against admin user IDs
    const isAdmin = user.email?.includes('@') && (
      user.email === 'admin@example.com' || 
      process.env.NODE_ENV === 'development'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await clearAdminOverride(user.id);

    return NextResponse.json({
      success: true,
      message: 'Admin override cleared - restored original subscription tier',
      userId: user.id
    });

  } catch (error) {
    console.error('Error clearing admin tier override:', error);
    return NextResponse.json(
      { error: 'Failed to clear admin override' },
      { status: 500 }
    );
  }
}