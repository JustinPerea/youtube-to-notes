import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('TEST AUTH - Starting auth check...');
    const session = await auth();
    console.log('TEST AUTH - Session result:', session);
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      message: 'Test auth endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('TEST AUTH - Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Test auth endpoint failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}