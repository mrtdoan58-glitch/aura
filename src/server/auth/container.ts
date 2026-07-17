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

// Next.js, Server Action'ları ve Server Component render'larını üretim build'inde
// ayrı chunk'lara koyabilir; bu chunk'lar aynı kaynak dosyayı ayrı modül örnekleri
// olarak yükleyebilir. Sıradan bir modül-seviyesi değişken bu durumda gerçek bir
// singleton olmaz (ör. login'de oluşturulan in-memory oturum, sayfa render'ında
// görünmez olur). `globalThis` süreç genelinde tek olduğundan gerçek bir singleton
// garanti eder (bkz. server/db/prisma.ts'teki aynı desen).
const globalForAuthContainer = globalThis as unknown as {
  __auraAuthInjectedDeps?: AuthDeps | null;
  __auraAuthCached?: AuthService | null;
};

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
  globalForAuthContainer.__auraAuthInjectedDeps = deps;
  globalForAuthContainer.__auraAuthCached = null;
}

/** Uygulama genelinde tek AuthService örneği. */
export function getAuthService(): AuthService {
  if (!globalForAuthContainer.__auraAuthCached) {
    globalForAuthContainer.__auraAuthCached = new AuthService(
      globalForAuthContainer.__auraAuthInjectedDeps ?? buildInMemoryDeps()
    );
  }
  return globalForAuthContainer.__auraAuthCached;
}
