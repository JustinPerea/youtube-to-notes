import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow Google AdSense crawler to access the site for verification
  const userAgent = request.headers.get('user-agent') || '';
  const isGoogleAdSenseCrawler = userAgent.includes('google') && 
    (userAgent.includes('adsense') || userAgent.includes('crawler') || userAgent.includes('bot'));
  
  // Skip all middleware checks for Google AdSense crawler
  if (isGoogleAdSenseCrawler) {
    return NextResponse.next();
  }

  // Get the response
  const response = NextResponse.next();

  // Security headers (additional to next.config.js)
  response.headers.set('X-Requested-With', 'XMLHttpRequest');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Powered-By', 'Next.js');

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Allow specific origins
    const allowedOrigins = [
      'http://localhost:3003',
      'http://localhost:3000',
      'https://youtube-to-notes.vercel.app',
      'https://*.vercel.app'
    ];

    const origin = request.headers.get('origin');
    const isAllowedOrigin = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        return origin?.includes(allowedOrigin.replace('*', ''));
      }
      return origin === allowedOrigin;
    });

    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin!);
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  // Block suspicious requests - but allow development tools
  const userAgent = request.headers.get('user-agent') || '';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In development, be more permissive for testing tools
  if (!isDevelopment) {
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
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
