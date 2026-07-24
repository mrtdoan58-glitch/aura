/**
 * Opsiyonel okuma-cache (Upstash Redis). KV env yoksa no-op (DB'ye düşer) — aynı
 * "opsiyonel entegrasyon" deseni. Anonim (kişiselleştirilmemiş) hot okuma uçlarını
 * kısa TTL ile önbelleğe alıp DB bağlantı havuzu yükünü ciddi azaltmak için kullanılır.
 */
import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/env";

let cached: Redis | null | undefined;

function getRedis(): Redis | null {
  if (cached !== undefined) return cached;
  const env = getEnv();
  cached =
    env.KV_REST_API_URL && env.KV_REST_API_TOKEN
      ? new Redis({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN })
      : null;
  return cached;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return (await redis.get<T>(key)) ?? null;
  } catch {
    return null; // cache hatası isteği bozmaz — DB'ye düşülür
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    /* best-effort */
  }
}
