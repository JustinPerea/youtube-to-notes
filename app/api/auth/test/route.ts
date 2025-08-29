import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    auth: {
      secret: process.env.AUTH_SECRET ? 'Set' : 'Not set',
      nexAuthSecret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
      authUrl: process.env.AUTH_URL ? 'Set' : 'Not set',
      vercelUrl: process.env.VERCEL_URL ? 'Set' : 'Not set',
    },
    environment: process.env.NODE_ENV,
  });
}
