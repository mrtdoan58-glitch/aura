/**
 * OTel-farkında yapısal logger. @opentelemetry/api varsa aktif trace bağlamını
 * (traceId/spanId) log satırına ekler — böylece log ↔ trace korelasyonu kurulur.
 * Paket yoksa sessizce düz JSON loglar (opsiyonel bağımlılık).
 */
import { ConsoleLogger, type Logger, type LogLevel, type SecurityEvent } from "@/server/observability/logger";

interface TraceContext {
  traceId?: string;
  spanId?: string;
}

function currentTrace(): TraceContext {
  try {
    // Dinamik/opsiyonel: paket yoksa boş bağlam döner.
    const api = (globalThis as { __otel__?: { traceId: string; spanId: string } }).__otel__;
    return api ? { traceId: api.traceId, spanId: api.spanId } : {};
  } catch {
    return {};
  }
}

export class OtelLogger implements Logger {
  private base = new ConsoleLogger();
  log(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
    this.base.log(level, message, { ...currentTrace(), ...meta });
  }
  security(event: SecurityEvent): void {
    this.log("warn", `security:${event.type}`, {
      event: event.type,
      userId: event.userId,
      ip: event.ip ?? undefined,
      ...event.meta,
    });
  }
}
