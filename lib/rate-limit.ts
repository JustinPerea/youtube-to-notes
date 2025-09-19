import { NextRequest } from 'next/server';
import { createClient } from 'redis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

type RateLimitResult = { allowed: boolean; remaining: number; resetTime: number };

interface IRateLimiter {
  isAllowed(identifier: string): Promise<RateLimitResult> | RateLimitResult;
  cleanup?(): void;
}

class MemoryRateLimiter implements IRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  constructor(private config: RateLimitConfig) {}

  isAllowed(identifier: string): RateLimitResult {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      const resetTime = now + this.config.windowMs;
      this.requests.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: this.config.maxRequests - 1, resetTime };
    }

    if (record.count >= this.config.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    this.requests.set(identifier, record);
    return { allowed: true, remaining: this.config.maxRequests - record.count, resetTime: record.resetTime };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) this.requests.delete(key);
    }
  }
}

class RedisRateLimiter implements IRateLimiter {
  private client;
  constructor(private config: RateLimitConfig, redisUrl: string) {
    this.client = createClient({ url: redisUrl });
    // Do not await connect here to avoid blocking import-time in serverless
    this.client.connect().catch(() => {
      // Fallback: if connect fails, we swallow here; applyRateLimit will failover via try/catch
    });
  }

  async isAllowed(identifier: string): Promise<RateLimitResult> {
    const key = `rate:${identifier}:${Math.floor(Date.now() / this.config.windowMs)}`;
    const ttlSeconds = Math.ceil(this.config.windowMs / 1000);
    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        // First hit: set window
        await this.client.expire(key, ttlSeconds);
      }
      const ttl = await this.client.ttl(key);
      const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : this.config.windowMs);
      const remaining = Math.max(0, this.config.maxRequests - count);
      return { allowed: count <= this.config.maxRequests, remaining, resetTime };
    } catch (e) {
      // If Redis fails, conservatively allow and let caller decide; upstream can log
      const resetTime = Date.now() + this.config.windowMs;
      return { allowed: true, remaining: this.config.maxRequests - 1, resetTime };
    }
  }
}

function createRateLimiter(config: RateLimitConfig): IRateLimiter {
  const redisUrl =
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_URL ||
    process.env.UPSTASH_REDIS_CONNECTION_URL;
  if (redisUrl) return new RedisRateLimiter(config, redisUrl);
  return new MemoryRateLimiter(config);
}

// Rate limiters for different endpoints (Redis if configured, else memory)
export const apiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 });
export const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 });
export const videoProcessingRateLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 50 });

// Helper function to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userId = request.headers.get('x-user-id');
  return userId ? `${ip}:${userId}` : ip;
}

// Rate limiting middleware function
export async function applyRateLimit(
  request: NextRequest,
  limiter: IRateLimiter,
  identifier?: string
) {
  const clientId = identifier || getClientIdentifier(request);
  const result = await limiter.isAllowed(clientId as string);

  if (!result.allowed) {
    return {
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
    };
  }

  return { success: true, remaining: result.remaining, resetTime: result.resetTime };
}

// Cleanup expired memory records periodically only when using memory backend
if (!(apiRateLimiter as any).client && typeof setInterval === 'function') {
  const cleanupInterval = setInterval(() => {
    (apiRateLimiter as MemoryRateLimiter).cleanup?.();
    (authRateLimiter as MemoryRateLimiter).cleanup?.();
    (videoProcessingRateLimiter as MemoryRateLimiter).cleanup?.();
  }, 60 * 1000);

  // Allow serverless runtimes to idle when nothing else is pending
  if (typeof (cleanupInterval as any).unref === 'function') {
    (cleanupInterval as any).unref();
  }
}
