# Security Implementation Plan

## 🚨 Current Security Status

### ✅ Fixed Issues
- [x] **No hardcoded secrets found** - All API keys are in environment variables
- [x] **Import paths fixed** - All relative imports replaced with `@/` alias
- [x] **Dependency vulnerabilities reduced** - Updated Next.js and other critical dependencies
- [x] **Authentication working** - Google OAuth properly configured
- [x] **Database security** - SSL connections and proper UUID handling

### ⚠️ Remaining Issues
- **esbuild vulnerability** (moderate) - Development-only issue
- **Next.js version** - Need to update to latest stable version
- **Rate limiting** - Not implemented yet
- **Security headers** - Not configured
- **CORS** - Basic configuration only
- **Content Security Policy** - Not implemented

## 🔧 Immediate Security Fixes Needed

### 1. Update Next.js to Latest Version
```bash
npm install next@latest
npm install react@latest react-dom@latest
```

### 2. Implement Rate Limiting
Create `lib/rate-limit.ts`:
```typescript
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }
    
    if (record.count >= this.config.maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }
}

export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per window
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 auth attempts per window
});
```

### 3. Add Security Headers
Create `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://generativelanguage.googleapis.com https://www.googleapis.com; frame-src 'self' https://accounts.google.com;"
          }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      }
    ]
  }
};

module.exports = nextConfig;
```

### 4. Implement Input Validation
Create `lib/validation.ts`:
```typescript
import { z } from 'zod';

export const videoUrlSchema = z.object({
  url: z.string().url().refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    { message: 'Invalid YouTube URL' }
  )
});

export const noteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  videoId: z.string().optional(),
  templateId: z.string().optional(),
  tags: z.array(z.string()).max(10)
});

export const verbositySchema = z.object({
  verbosity: z.enum(['brief', 'standard', 'detailed'])
});

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .trim();
}
```

### 5. Enhanced Error Handling
Update API routes to not leak sensitive information:
```typescript
// Example for API routes
export async function POST(request: NextRequest) {
  try {
    // ... implementation
  } catch (error) {
    console.error('API Error:', error);
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
```

## 🛡️ Additional Security Measures

### 1. Environment Variable Validation
Create `lib/env-validation.ts`:
```typescript
export function validateEnvironment() {
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DATABASE_URL',
    'GOOGLE_GENERATIVE_AI_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate URL formats
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
    throw new Error('NEXTAUTH_URL must use HTTPS in production');
  }
}
```

### 2. Database Security Enhancements
Update `lib/db/connection.ts`:
```typescript
// Add connection pooling and timeout settings
const dbConfig = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false
  }
};
```

### 3. Session Security
Update `lib/auth.ts`:
```typescript
export const authOptions: NextAuthOptions = {
  // ... existing config
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  }
};
```

## 📋 Pre-Launch Security Checklist

### Before Going Public

#### Environment & Infrastructure
- [ ] **HTTPS enforced** - All traffic uses HTTPS
- [ ] **Environment variables secure** - No secrets in logs or client
- [ ] **Database secured** - SSL, proper credentials, access controls
- [ ] **Domain security** - DNS, SSL certificates configured

#### Application Security
- [ ] **Rate limiting implemented** - Prevent abuse
- [ ] **Input validation** - Sanitize all user inputs
- [ ] **Security headers** - CSP, HSTS, X-Frame-Options
- [ ] **Error handling** - No sensitive data in error messages
- [ ] **Authentication secure** - OAuth properly configured

#### Dependencies & Updates
- [ ] **Dependencies updated** - No known vulnerabilities
- [ ] **Regular updates** - Automated security updates
- [ ] **Vulnerability monitoring** - Regular security scans

#### Monitoring & Logging
- [ ] **Error logging** - Structured logging without secrets
- [ ] **Security monitoring** - Monitor for suspicious activity
- [ ] **Performance monitoring** - Track application performance
- [ ] **Backup systems** - Data backup and recovery

#### Legal & Compliance
- [ ] **Privacy policy** - Clear data handling practices
- [ ] **Terms of service** - User agreements
- [ ] **GDPR compliance** - Data protection regulations
- [ ] **Cookie consent** - User consent mechanisms

## 🚀 Implementation Timeline

### Phase 1: Critical Security (Immediate)
1. Update Next.js and dependencies
2. Implement rate limiting
3. Add security headers
4. Enhance error handling

### Phase 2: Enhanced Security (1-2 weeks)
1. Input validation system
2. Enhanced logging and monitoring
3. Database security improvements
4. Session security enhancements

### Phase 3: Production Ready (2-4 weeks)
1. Privacy policy and terms
2. GDPR compliance measures
3. Security monitoring setup
4. Backup and disaster recovery

## 🔍 Security Testing

### Automated Tests
```bash
# Run security audit
npm audit

# Check for hardcoded secrets
grep -r "password\|secret\|key\|token" --include="*.ts" --include="*.js" .

# Test rate limiting
curl -X POST http://localhost:3000/api/test-rate-limit

# Check security headers
curl -I https://your-domain.vercel.app
```

### Manual Testing
1. **Authentication testing** - Test OAuth flow
2. **Input validation** - Test with malicious inputs
3. **Rate limiting** - Test abuse scenarios
4. **Error handling** - Verify no sensitive data leaked

## 📞 Security Contacts

- **Security Issues**: [Your email]
- **Emergency Contact**: [Emergency contact]
- **Legal Contact**: [Legal contact]

---

**Next Steps**:
1. Implement critical security fixes
2. Run security tests
3. Deploy with security measures
4. Monitor for security issues
5. Regular security reviews

**Estimated Timeline**: 1-2 weeks for critical security, 2-4 weeks for full production readiness
