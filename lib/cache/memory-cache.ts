/**
 * High-Performance Memory Cache
 * 
 * Provides intelligent caching for API responses to reduce latency
 * Expected improvement: 30-50% faster repeated operations
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  accessCount: number;
  lastAccessed: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum cache entries
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Store data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const now = Date.now();
    const ttl = ttlMs || this.defaultTTL;
    
    // Clean old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl,
      accessCount: 0,
      lastAccessed: now
    });

    console.log(`🗂️  CACHE: Stored "${key}" (TTL: ${Math.round(ttl / 1000)}s)`);
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`🔍 CACHE: Miss for "${key}"`);
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiry) {
      console.log(`⏰ CACHE: Expired "${key}" (age: ${Math.round((now - entry.timestamp) / 1000)}s)`);
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    const age = Math.round((now - entry.timestamp) / 1000);
    console.log(`✅ CACHE: Hit for "${key}" (age: ${age}s, hits: ${entry.accessCount})`);
    
    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Remove specific entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️  CACHE: Deleted "${key}"`);
    }
    return deleted;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🧹 CACHE: Cleared ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      age: number;
      accessCount: number;
      timeToExpiry: number;
    }>;
  } {
    const now = Date.now();
    const entries: any[] = [];
    let totalAccess = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = Math.round((now - entry.timestamp) / 1000);
      const timeToExpiry = Math.round((entry.expiry - now) / 1000);
      
      entries.push({
        key,
        age,
        accessCount: entry.accessCount,
        timeToExpiry
      });
      
      totalAccess += entry.accessCount;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccess > 0 ? totalAccess / (totalAccess + entries.length) : 0,
      entries: entries.sort((a, b) => b.accessCount - a.accessCount)
    };
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove oldest 20% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.2));
    
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
    }

    console.log(`🧹 CACHE: Evicted ${toRemove} LRU entries`);
  }

  /**
   * Generate cache key from URL
   */
  generateKey(prefix: string, ...params: string[]): string {
    return `${prefix}:${params.join(':')}`;
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();

// Cache key generators for common operations
export const CacheKeys = {
  YOUTUBE_METADATA: (videoId: string) => 
    memoryCache.generateKey('youtube-metadata', videoId),
  
  YOUTUBE_TRANSCRIPT: (videoId: string) => 
    memoryCache.generateKey('youtube-transcript', videoId),
    
  GEMINI_RESPONSE: (modelName: string, contentHash: string) => 
    memoryCache.generateKey('gemini-response', modelName, contentHash),
    
  USER_SUBSCRIPTION: (userId: string) => 
    memoryCache.generateKey('user-subscription', userId)
};

// TTL constants (in milliseconds)
export const CacheTTL = {
  YOUTUBE_METADATA: 10 * 60 * 1000, // 10 minutes - video metadata doesn't change often
  YOUTUBE_TRANSCRIPT: 60 * 60 * 1000, // 1 hour - transcripts are static
  GEMINI_RESPONSE: 30 * 60 * 1000, // 30 minutes - AI responses can be reused for same inputs
  USER_SUBSCRIPTION: 2 * 60 * 1000, // 2 minutes - subscription status changes less frequently
  DEFAULT: 5 * 60 * 1000 // 5 minutes default
};