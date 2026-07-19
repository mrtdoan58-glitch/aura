/**
 * Üretim bağımlılıkları — Prisma repoları + (yer tutucu) altyapı servisleri.
 * `prisma generate` gerektirir; tsconfig `exclude` ile typecheck dışında.
 * Kullanım: dağıtım giriş noktasında `configureAuthDeps(buildPrismaDeps())` çağrılır.
 * NOT: rate limiter ve mailer burada üretim implementasyonlarıyla (Redis, Resend) değiştirilmelidir.
 */
import type { AuthDeps } from "@/server/auth/services/auth-service";
import { InMemoryRateLimiter, type RateLimiter } from "@/server/rate-limit/rate-limiter";
import { RedisRateLimiter } from "@/server/rate-limit/redis-rate-limiter";
import { ConsoleMailer, type Mailer } from "@/server/auth/mailer";
import { ResendMailer } from "@/server/auth/resend-mailer";
import { ConsoleLogger } from "@/server/observability/logger";
import { getEnv } from "@/lib/env";
import { Redis } from "@upstash/redis";
import {
  PrismaUserRepository, PrismaSessionRepository,
  PrismaLoginAttemptRepository, prismaEmailTokenRepository, prismaResetTokenRepository,
} from "@/server/auth/repositories/prisma";

function buildMailer(): Mailer {
  const env = getEnv();
  if (env.RESEND_API_KEY && env.RESEND_EMAIL_DOMAIN) {
    return new ResendMailer(env.RESEND_API_KEY, env.RESEND_EMAIL_DOMAIN, env.APP_URL);
  }
  // RESEND_API_KEY/RESEND_EMAIL_DOMAIN ayarlanmamışsa (henüz kurulmamış
  // ortamlar) sessizce ConsoleMailer'a düşer — e-posta gönderilmez ama
  // uygulama çökmez.
  return new ConsoleMailer();
}

function buildLoginRateLimiter(): RateLimiter {
  const env = getEnv();
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    const redis = new Redis({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN });
    return new RedisRateLimiter(redis, 5, 15 * 60 * 1000);
  }
  // Redis ayarlanmamışsa in-memory'e düşer — tek instance'ta çalışır ama
  // restart'ta/instance'lar arasında paylaşılmaz.
  return new InMemoryRateLimiter(5, 15 * 60 * 1000);
}

export function buildPrismaDeps(): AuthDeps {
  return {
    users: new PrismaUserRepository(),
    sessions: new PrismaSessionRepository(),
    emailTokens: prismaEmailTokenRepository,
    resetTokens: prismaResetTokenRepository,
    loginAttempts: new PrismaLoginAttemptRepository(),
    loginRateLimiter: buildLoginRateLimiter(),
    mailer: buildMailer(),
    logger: new ConsoleLogger(),
  };
}
