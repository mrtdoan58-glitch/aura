/**
 * Üretim bağımlılıkları — Prisma repoları + (yer tutucu) altyapı servisleri.
 * `prisma generate` gerektirir; tsconfig `exclude` ile typecheck dışında.
 * Kullanım: dağıtım giriş noktasında `configureAuthDeps(buildPrismaDeps())` çağrılır.
 * NOT: rate limiter ve mailer burada üretim implementasyonlarıyla (Redis, Resend) değiştirilmelidir.
 */
import type { AuthDeps } from "@/server/auth/services/auth-service";
import { InMemoryRateLimiter } from "@/server/rate-limit/rate-limiter";
import { ConsoleMailer, type Mailer } from "@/server/auth/mailer";
import { ResendMailer } from "@/server/auth/resend-mailer";
import { ConsoleLogger } from "@/server/observability/logger";
import { getEnv } from "@/lib/env";
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

export function buildPrismaDeps(): AuthDeps {
  return {
    users: new PrismaUserRepository(),
    sessions: new PrismaSessionRepository(),
    emailTokens: prismaEmailTokenRepository,
    resetTokens: prismaResetTokenRepository,
    loginAttempts: new PrismaLoginAttemptRepository(),
    // TODO(prod): Redis sliding-window rate limiter ile değiştir.
    loginRateLimiter: new InMemoryRateLimiter(5, 15 * 60 * 1000),
    mailer: buildMailer(),
    logger: new ConsoleLogger(),
  };
}
