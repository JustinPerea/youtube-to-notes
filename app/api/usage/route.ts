import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { getUserUsage } from '@/lib/subscription/service';

export const dynamic = 'force-dynamic';

interface UsageResponse {
  userId: string;
  month: string;
  subscription: {
    id: string;
    userId: string;
    tier: 'free' | 'basic' | 'pro';
    status: 'active' | 'canceled' | 'past_due' | 'incomplete';
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    adminOverride?: {
      tier: 'free' | 'basic' | 'pro';
      expires?: Date;
    };
  };
  notesGenerated: number;
  aiQuestionsAsked: number;
  storageUsedMb: number;
  noteLimit: number;
  aiQuestionLimit: number;
  storageLimitMb: number;
  canGenerateNote: boolean;
  canUseAI: boolean;
  canUseStorage: boolean;
  resetDate: Date;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * GET /api/usage
 * Retrieves comprehensive usage data for the authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse<UsageResponse | ErrorResponse>> {
  try {
    console.log('Fetching user usage data...');

    // 1. Authenticate user
    const session = await getApiSessionWithDatabase(request);
    if (!session || !session.user || !session.user.id) {
      console.log('No valid session found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { user: sessionUser } = session;
    console.log('Authenticated user:', { 
      id: sessionUser.id, 
      email: sessionUser.email 
    });

    // 2. Get usage data using subscription service
    const usageData = await getUserUsage(sessionUser.id);
    
    if (!usageData) {
      console.error('Usage data not found for user:', sessionUser.id);
      return NextResponse.json(
        { error: 'Usage data not found. User may need to complete onboarding.' },
        { status: 404 }
      );
    }

    console.log('Usage data retrieved successfully:', {
      userId: usageData.userId,
      tier: usageData.subscription.tier,
      notesGenerated: usageData.notesGenerated,
      noteLimit: usageData.noteLimit,
      aiQuestionsAsked: usageData.aiQuestionsAsked,
      aiQuestionLimit: usageData.aiQuestionLimit
    });

    // 3. Return usage data
    return NextResponse.json(usageData, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching usage data:', error);
    
    // Handle database errors
    if (error.message?.includes('database') || error.message?.includes('connection')) {
      return NextResponse.json(
        { 
          error: 'Database error occurred',
          details: 'Unable to access usage data' 
        },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function POST(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}