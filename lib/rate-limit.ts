import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(identifier);
    
    // If no record exists or window has expired, create new record
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }
    
    // Check if limit exceeded
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }
    
    // Increment count
    record.count++;
    this.requests.set(identifier, record);
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }
  
  // Clean up expired records (optional, for memory management)
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per window
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 auth attempts per window
});

export const videoProcessingRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50 // 50 video processing requests per hour
});

// Helper function to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  // Use IP address as primary identifier
  const ip = request.ip || 
             request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';
  
  // If user is authenticated, include user ID for better tracking
  const userId = request.headers.get('x-user-id');
  
  return userId ? `${ip}:${userId}` : ip;
}

// Rate limiting middleware function
export function applyRateLimit(
  request: NextRequest, 
  limiter: RateLimiter,
  identifier?: string
) {
  const clientId = identifier || getClientIdentifier(request);
  const result = limiter.isAllowed(clientId);
  
  if (!result.allowed) {
    return {
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
    };
  }
  
  return {
    success: true,
    remaining: result.remaining,
    resetTime: result.resetTime
  };
}

// Cleanup expired records periodically (optional)
setInterval(() => {
  apiRateLimiter.cleanup();
  authRateLimiter.cleanup();
  videoProcessingRateLimiter.cleanup();
}, 60 * 1000); // Clean up every minute
