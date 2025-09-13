/**
 * Simple test endpoint to verify debug endpoints work
 */

import { NextResponse } from "next/server";
import { isDebugEnabled } from "@/lib/security/debug-gate";

// Ensure this debug route is always dynamic so middleware runs
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDebugEnabled()) {
    return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  return NextResponse.json({
    message: "Debug endpoint is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}
