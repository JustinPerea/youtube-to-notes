import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return NextResponse.json({
      error: 'DATABASE_URL not set',
      suggestion: 'Please set the DATABASE_URL environment variable'
    });
  }

  // Parse the connection string to check format
  try {
    const url = new URL(databaseUrl);
    
    return NextResponse.json({
      connectionString: {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        username: url.username,
        database: url.pathname.slice(1), // Remove leading slash
        hasPassword: url.password ? 'Yes' : 'No',
        passwordLength: url.password ? url.password.length : 0
      },
      analysis: {
        isPoolerUrl: url.hostname?.includes('pooler') || false,
        isSupabaseUrl: url.hostname?.includes('supabase') || false,
        isDirectConnection: url.hostname?.includes('db.') || false,
        hasQueryParams: url.search ? true : false,
        queryParams: url.search ? url.search : 'None'
      },
      suggestions: []
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid DATABASE_URL format',
      details: error instanceof Error ? error.message : 'Unknown error',
      rawUrl: databaseUrl
    });
  }
}
