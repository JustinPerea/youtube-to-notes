import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { updateUserSubscription } from '@/lib/subscription/service';

export const dynamic = 'force-dynamic';

/**
 * Emergency admin endpoint to manually fix subscription
 * POST /api/admin/fix-subscription - Manually set user subscription to Pro
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await getApiSessionWithDatabase(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Admin check - more permissive for emergency fixing
    const isAdmin = user.email?.includes('@') && (
      user.email === 'admin@example.com' || 
      user.email?.endsWith('@gmail.com') || // Allow gmail for dev testing
      process.env.NODE_ENV === 'development'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('🔧 Emergency subscription fix for user:', user.id, user.email);

    // Manually set the user to Pro subscription
    await updateUserSubscription(user.id, {
      tier: 'pro',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    console.log('✅ Manual subscription fix applied:', {
      userId: user.id,
      email: user.email,
      newTier: 'pro'
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription manually fixed to Pro',
      userId: user.id,
      email: user.email,
      newTier: 'pro'
    });

  } catch (error) {
    console.error('Error in emergency subscription fix:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix subscription',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : 
          undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Emergency subscription fix endpoint',
    usage: 'POST to this endpoint to manually set your subscription to Pro'
  });
}