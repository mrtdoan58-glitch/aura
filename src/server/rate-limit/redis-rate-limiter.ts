/**
 * Üretim rate limiter'ı — Upstash Redis üzerinde sliding-window algoritması.
 * @upstash/ratelimit, pencere sayımını tek bir Lua script ile atomik olarak
 * yürütür; bu da çoklu serverless instance'lar arasında race condition olmadan
 * paylaşılan bir limit sağlar (InMemoryRateLimiter'ın aksine).
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { RateLimiter, RateLimitResult } from "@/server/rate-limit/rate-limiter";

export class RedisRateLimiter implements RateLimiter {
  private readonly ratelimit: Ratelimit;

  constructor(redis: Redis, limit: number, windowMs: number) {
    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
    });
  }

  async consume(key: string): Promise<RateLimitResult> {
    const { success, remaining, reset } = await this.ratelimit.limit(key);
    return { allowed: success, remaining, resetAt: reset };
  }
}
