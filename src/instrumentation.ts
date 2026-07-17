/**
 * Next.js instrumentation — OpenTelemetry + Sentry başlatma.
 * Paketler kurulu ve env ayarlıysa aktif olur; aksi halde no-op.
 */
import { registerOTel } from "@vercel/otel";

export async function register() {
  // Ortam değişkenlerini erken doğrula (yanlış konfigürasyon fail-fast).
  const { getEnv } = await import("@/lib/env");
  getEnv();
  registerOTel({ serviceName: "aura" });
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
}

export async function onRequestError(err: unknown, request: unknown, context: unknown) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err as Error, request as never, context as never);
}
