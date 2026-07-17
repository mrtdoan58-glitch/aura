/**
 * Rate limiter soyutlaması. In-memory implementasyon dev/test için;
 * üretimde aynı arayüzü uygulayan bir Redis (sliding window) implementasyonu takılır.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimiter {
  consume(key: string): Promise<RateLimitResult>;
}

export class InMemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, number[]>();
  private opsSinceSweep = 0;
  private static readonly SWEEP_EVERY = 500;

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now
  ) {}

  async consume(key: string): Promise<RateLimitResult> {
    const t = this.now();
    const windowStart = t - this.windowMs;
    const arr = (this.hits.get(key) ?? []).filter((ts) => ts > windowStart);

    this.maybeSweep(windowStart);

    if (arr.length >= this.limit) {
      this.hits.set(key, arr);
      return { allowed: false, remaining: 0, resetAt: arr[0] + this.windowMs };
    }
    arr.push(t);
    this.hits.set(key, arr);
    return { allowed: true, remaining: this.limit - arr.length, resetAt: t + this.windowMs };
  }

  /** Bellek sızıntısını önler: periyodik olarak süresi geçmiş anahtarları düşürür. */
  private maybeSweep(windowStart: number): void {
    if (++this.opsSinceSweep < InMemoryRateLimiter.SWEEP_EVERY) return;
    this.opsSinceSweep = 0;
    for (const [k, v] of this.hits) {
      const alive = v.filter((ts) => ts > windowStart);
      if (alive.length === 0) this.hits.delete(k);
      else this.hits.set(k, alive);
    }
  }

  reset(): void {
    this.hits.clear();
    this.opsSinceSweep = 0;
  }
}
