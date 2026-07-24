/**
 * Next.js instrumentation — OpenTelemetry + Sentry başlatma.
 * Paketler kurulu ve env ayarlıysa aktif olur; aksi halde no-op.
 */
import { registerOTel } from "@vercel/otel";

export async function register() {
  // Ortam değişkenlerini erken doğrula (yanlış konfigürasyon fail-fast).
  const { getEnv } = await import("@/lib/env");
  const env = getEnv();
  registerOTel({ serviceName: "aura" });
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    // AUTH_DRIVER=prisma iken üretim (Prisma) bağımlılıklarını enjekte et;
    // aksi halde container varsayılan olarak in-memory'e düşer. Prisma client
    // yalnızca Node.js runtime'da çalıştığından edge'de atlanır.
    if (env.AUTH_DRIVER === "prisma") {
      const { configureAuthDeps } = await import("@/server/auth/container");
      const { buildPrismaDeps } = await import("@/server/auth/prisma-deps");
      configureAuthDeps(buildPrismaDeps());

      const { configureFeedDeps } = await import("@/server/feed/container");
      const { buildPrismaFeedDeps } = await import("@/server/feed/prisma-deps");
      configureFeedDeps(buildPrismaFeedDeps());

      // social, users/posts için yukarıdaki auth/feed servislerini yeniden kullanır
      // (bkz. server/social/prisma-deps.ts) — bu yüzden ikisinden SONRA yapılandırılır.
      const { configureSocialDeps } = await import("@/server/social/container");
      const { buildPrismaSocialDeps } = await import("@/server/social/prisma-deps");
      configureSocialDeps(buildPrismaSocialDeps());

      // notifications, follow-back durumu için social'ı kullanır — social'dan SONRA.
      const { configureNotificationDeps } = await import("@/server/notifications/container");
      const { buildPrismaNotificationDeps } = await import("@/server/notifications/prisma-deps");
      configureNotificationDeps(buildPrismaNotificationDeps());

      // messaging, kullanıcı bilgisi için auth'u kullanır — auth'tan SONRA.
      const { configureMessagingDeps } = await import("@/server/messaging/container");
      const { buildPrismaMessagingDeps } = await import("@/server/messaging/prisma-deps");
      configureMessagingDeps(buildPrismaMessagingDeps());
    }
  }
}

export async function onRequestError(err: unknown, request: unknown, context: unknown) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err as Error, request as never, context as never);
}
