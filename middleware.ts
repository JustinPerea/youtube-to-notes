import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Generate a per-request nonce for CSP (move toward nonce-based policy)
  let nonce = '';
  try {
    // Use Web Crypto for randomness (Edge-compatible)
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    nonce = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback if crypto not available
    nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  // Allow Google AdSense crawler to access the site for verification
  const userAgent = request.headers.get('user-agent') || '';
  const isGoogleAdSenseCrawler = userAgent.includes('google') && 
    (userAgent.includes('adsense') || userAgent.includes('crawler') || userAgent.includes('bot'));
  
  // Skip all middleware checks for Google AdSense crawler
  if (isGoogleAdSenseCrawler) {
    return NextResponse.next();
  }

  // Gate debug endpoints in production unless explicitly enabled
  const isDebugEndpoint = request.nextUrl.pathname.startsWith('/api/debug/');
  const debugEnabled = process.env.DEBUG_ENDPOINTS_ENABLED === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDebugEndpoint && !isDevelopment && !debugEnabled) {
    return new NextResponse(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Attach nonce to downstream request (so app/layout can read it)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Get the response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Also reflect nonce on response for debugging/diagnostics
  response.headers.set('x-nonce', nonce);

  // Security headers (additional to next.config.js)
  response.headers.set('X-Requested-With', 'XMLHttpRequest');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Powered-By', 'Next.js');

  // Dynamic CSP with nonce (keeps 'unsafe-inline' for now; will remove later once all scripts have nonce)
  const isPreview = process.env.VERCEL_ENV === 'preview';
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://ep2.adtrafficquality.google',
    'https://www.google.com',
  ];
  // Keep 'unsafe-inline' only outside preview for now; plan removal later in production too
  if (!isPreview) {
    scriptSrc.splice(1, 0, "'unsafe-inline'");
  }
  // Only allow 'unsafe-eval' in development; preview/prod exclude
  if (isDevelopment) {
    scriptSrc.splice(1, 0, "'unsafe-eval'");
  }

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: https://i.ytimg.com https://yt3.googleusercontent.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://googleads.g.doubleclick.net",
    "connect-src 'self' https://generativelanguage.googleapis.com https://*.supabase.co https://accounts.google.com https://www.googleapis.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://www.google.com",
    "frame-src 'self' https://accounts.google.com https://googleads.g.doubleclick.net https://ep2.adtrafficquality.google https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin') || '';

    // Default: do not allow any origin unless matched
    let isAllowedOrigin = false;

    if (origin) {
      try {
        const url = new URL(origin);
        const { hostname, protocol } = url;

        // Allow production domains
        if (hostname === 'kyotoscribe.com' || hostname === 'www.kyotoscribe.com') {
          isAllowedOrigin = true;
        }

        // Allow localhost for development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          // Optionally restrict to http only in dev
          if (protocol === 'http:' || process.env.NODE_ENV !== 'production') {
            isAllowedOrigin = true;
          }
        }

        // Allow Vercel preview deployments (e.g., *.vercel.app)
        if (hostname.endsWith('.vercel.app')) {
          isAllowedOrigin = true;
        }

      } catch {
        // Malformed origin header — leave isAllowedOrigin = false
      }
    }

    if (isAllowedOrigin && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  // Block suspicious requests - but allow development tools and debug endpoints
  
  // In development, be more permissive for testing tools
  // Also allow debug endpoints in production for troubleshooting
  if (!isDevelopment && !isDebugEndpoint) {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /postman/i,
      /curl/i,
      /wget/i,
      /python/i,
      /perl/i,
      /ruby/i
    ];

    // Allow legitimate bots but block suspicious ones
    const isSuspiciousBot = suspiciousPatterns.some(pattern => 
      pattern.test(userAgent) && 
      !userAgent.includes('googlebot') && 
      !userAgent.includes('bingbot') &&
      !userAgent.includes('slurp') && // Yahoo
      !userAgent.includes('google') && // Allow all Google services including AdSense crawler
      !userAgent.includes('adsense') // Specifically allow AdSense crawler
    );

    if (isSuspiciousBot) {
      return new NextResponse(
        JSON.stringify({ error: 'Access denied' }), 
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  // Block requests with suspicious query parameters
  const url = request.nextUrl;
  const suspiciousParams = ['eval', 'script', 'javascript', 'vbscript', 'onload', 'onerror'];
  
  for (const param of suspiciousParams) {
    if (url.searchParams.has(param)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request parameters' }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  // Add user ID to headers for authenticated requests
  if (request.cookies.has('next-auth.session-token')) {
    // Extract user ID from session token if possible
    // This is a simplified approach - in production you might want to decode the JWT
    response.headers.set('X-User-Authenticated', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api/debug (debug endpoints for troubleshooting)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/debug/).*)',
  ],
};
