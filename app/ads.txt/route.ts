import { NextResponse } from 'next/server'

export async function GET() {
  const adsTxtContent = 'google.com, pub-4135776739187234, DIRECT, f08c47fec0942fa0'
  
  return new NextResponse(adsTxtContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}
