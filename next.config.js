/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@google/generative-ai'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ADSENSE_ENABLED: process.env.NEXT_PUBLIC_ADSENSE_ENABLED,
    NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
  },
  async headers() {
    const isPreview = process.env.VERCEL_ENV === 'preview';
    // Build CSP dynamically; tighten on preview by removing 'unsafe-eval'
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'", // kept for GTM/ads; consider nonces later
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://pagead2.googlesyndication.com',
      'https://googleads.g.doubleclick.net',
      'https://ep2.adtrafficquality.google',
      'https://www.google.com',
    ];
    if (!isPreview) {
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

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          // CSP now set dynamically in middleware with nonce support
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/videos/process',
        destination: '/api/videos/process',
      },
      {
        source: '/api/templates/:path*',
        destination: '/api/templates/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
