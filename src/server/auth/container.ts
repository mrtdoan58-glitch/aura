/**
 * Kompozisyon kökü + enjeksiyon dikişi.
 * Varsayılan: in-memory repolar (dev/test, DB gerektirmez).
 * Üretim: dağıtım giriş noktası (ör. instrumentation) `configureAuthDeps(buildPrismaDeps())`
 * çağırarak Prisma bağımlılıklarını enjekte eder — bu sayede çekirdek, Prisma'ya statik
 * bağımlı olmaz ve typecheck/test DB'siz çalışır (Dependency Inversion).
 */
import { AuthService, type AuthDeps } from "@/server/auth/services/auth-service";
import { InMemoryRateLimiter } from "@/server/rate-limit/rate-limiter";
import { ConsoleMailer } from "@/server/auth/mailer";
import { OtelLogger } from "@/server/observability/otel-logger";
import {
  InMemoryUserRepository, InMemorySessionRepository,
  InMemoryTokenRepository, InMemoryLoginAttemptRepository,
} from "@/server/auth/repositories/in-memory";

let injectedDeps: AuthDeps | null = null;
let cached: AuthService | null = null;

/** Test/dev bağımlılıkları — DB'siz. Testler bunu doğrudan kullanır. */
export function buildInMemoryDeps(now?: () => Date): AuthDeps {
  return {
    users: new InMemoryUserRepository(),
    sessions: new InMemorySessionRepository(),
    emailTokens: new InMemoryTokenRepository(),
    resetTokens: new InMemoryTokenRepository(),
    loginAttempts: new InMemoryLoginAttemptRepository(),
    loginRateLimiter: new InMemoryRateLimiter(5, 15 * 60 * 1000, now ? () => now().getTime() : undefined),
    mailer: new ConsoleMailer(),
    logger: new OtelLogger(),
    now,
  };
}

/** Üretim composition-root'u tarafından çağrılır (ör. Prisma + Redis + Resend bağımlılıkları). */
export function configureAuthDeps(deps: AuthDeps): void {
  injectedDeps = deps;
  cached = null;
}

/** Uygulama genelinde tek AuthService örneği. */
export function getAuthService(): AuthService {
  if (!cached) cached = new AuthService(injectedDeps ?? buildInMemoryDeps());
  return cached;
}
