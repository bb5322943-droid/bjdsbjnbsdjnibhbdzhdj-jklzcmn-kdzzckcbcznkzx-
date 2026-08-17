/**
 * Simple in-memory cache for API responses.
 * Production'da Redis ishlatish tavsiya etiladi.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  /**
   * Cache'ga qiymat qo'shish
   * @param key - Cache key
   * @param data - Cache'lanishi kerak bo'lgan ma'lumot
   * @param ttlSeconds - Time to live (soniyalarda)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
  }
  
  /**
   * Cache'dan qiymat olish
   * @returns Ma'lumot yoki null (agar mavjud bo'lmasa yoki muddati o'tgan bo'lsa)
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Muddati o'tgan cache
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Cache'ni tozalash
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Pattern bo'yicha cache'larni tozalash
   * Masalan: invalidate('products:*') - barcha product cache'larni o'chiradi
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Muddati o'tgan cache'larni tozalash
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Barcha cache'ni tozalash
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Cache statistikasi
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cache = new MemoryCache();

// Har 5 daqiqada eski cache'larni tozalash
setInterval(() => {
  const cleaned = cache.cleanup();
  if (cleaned > 0) {
    console.log(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
  }
}, 5 * 60 * 1000);

/**
 * Express middleware - response'ni cache'lash
 */
export function cacheMiddleware(ttlSeconds: number = 300) {
  return (req: any, res: any, next: any) => {
    // Faqat GET so'rovlar cache'lanadi
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `cache:${req.originalUrl}`;
    const cached = cache.get(key);
    
    if (cached) {
      console.log(`✅ Cache hit: ${req.originalUrl}`);
      return res.json(cached);
    }
    
    // Response'ni intercept qilib cache'lash
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      cache.set(key, data, ttlSeconds);
      console.log(`💾 Cached: ${req.originalUrl} (TTL: ${ttlSeconds}s)`);
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Cache invalidation helper
 * Ma'lumot o'zgarganda tegishli cache'larni o'chirish uchun
 */
export function invalidateCache(patterns: string[]): void {
  for (const pattern of patterns) {
    const count = cache.invalidatePattern(pattern);
    if (count > 0) {
      console.log(`🗑️  Invalidated ${count} cache entries: ${pattern}`);
    }
  }
}
