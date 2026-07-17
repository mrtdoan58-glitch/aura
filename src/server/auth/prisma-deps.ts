/**
 * Üretim bağımlılıkları — Prisma repoları + (yer tutucu) altyapı servisleri.
 * `prisma generate` gerektirir; tsconfig `exclude` ile typecheck dışında.
 * Kullanım: dağıtım giriş noktasında `configureAuthDeps(buildPrismaDeps())` çağrılır.
 * NOT: rate limiter ve mailer burada üretim implementasyonlarıyla (Redis, Resend) değiştirilmelidir.
 */
import type { AuthDeps } from "@/server/auth/services/auth-service";
import { InMemoryRateLimiter } from "@/server/rate-limit/rate-limiter";
import { ConsoleMailer } from "@/server/auth/mailer";
import { ConsoleLogger } from "@/server/observability/logger";
import {
  PrismaUserRepository, PrismaSessionRepository,
  PrismaLoginAttemptRepository, prismaEmailTokenRepository, prismaResetTokenRepository,
} from "@/server/auth/repositories/prisma";

export function buildPrismaDeps(): AuthDeps {
  return {
    users: new PrismaUserRepository(),
    sessions: new PrismaSessionRepository(),
    emailTokens: prismaEmailTokenRepository,
    resetTokens: prismaResetTokenRepository,
    loginAttempts: new PrismaLoginAttemptRepository(),
    // TODO(prod): Redis sliding-window rate limiter ile değiştir.
    loginRateLimiter: new InMemoryRateLimiter(5, 15 * 60 * 1000),
    // TODO(prod): Resend/SES mailer ile değiştir.
    mailer: new ConsoleMailer(),
    logger: new ConsoleLogger(),
  };
}
