/**
 * Simple test endpoint to verify debug endpoints work
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Debug endpoint is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}
