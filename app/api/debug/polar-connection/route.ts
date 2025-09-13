/**
 * Debug endpoint to test Polar API connection
 * This helps diagnose authentication and configuration issues
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDebugEnabled } from '@/lib/security/debug-gate';

export async function GET(req: NextRequest) {
  if (!isDebugEnabled()) {
    return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    // Allow unauthenticated access for debugging purposes
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    // Check environment variables
    const envCheck = {
      POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN ? '✅ Set' : '❌ Missing',
      POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing',
      POLAR_PRO_PRODUCT_ID: process.env.POLAR_PRO_PRODUCT_ID ? '✅ Set' : '❌ Missing',
      POLAR_BASIC_PRODUCT_ID: process.env.POLAR_BASIC_PRODUCT_ID ? '✅ Set' : '❌ Missing',
      POLAR_SUCCESS_URL: process.env.POLAR_SUCCESS_URL ? '✅ Set' : '❌ Missing',
    };

    // Test Polar API connection
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    let apiTest = null;

    if (accessToken) {
      try {
        const response = await fetch('https://api.polar.sh/v1/organizations', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        apiTest = {
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          error: response.ok ? null : await response.text()
        };
      } catch (error) {
        apiTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json({
      environment: envCheck,
      apiTest: apiTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Polar connection debug error:', error);
    return NextResponse.json(
      { 
        error: 'Debug check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
