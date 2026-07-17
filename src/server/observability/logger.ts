/**
 * Yapısal (JSON) logger + güvenlik olayları. PII sızdırmaz (yalnız hash'li/anonim alanlar).
 * Üretimde bu arayüz Sentry/OTel/Datadog taşıyıcısına bağlanır.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface SecurityEvent {
  type:
    | "login_failed"
    | "login_success"
    | "account_locked"
    | "rate_limited"
    | "token_reuse_detected"
    | "password_reset"
    | "email_verified";
  userId?: string;
  ip?: string | null;
  meta?: Record<string, unknown>;
}

export interface Logger {
  log(level: LogLevel, message: string, meta?: Record<string, unknown>): void;
  security(event: SecurityEvent): void;
}

export class ConsoleLogger implements Logger {
  log(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
    const line = JSON.stringify({ ts: new Date().toISOString(), level, message, ...meta });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
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

/** Test/sessiz ortamlar için no-op. */
export class NoopLogger implements Logger {
  log(): void {}
  security(): void {}
}
