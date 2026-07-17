import { describe, it, expect } from "vitest";
import { AuthService, type AuthDeps } from "@/server/auth/services/auth-service";
import { buildInMemoryDeps } from "@/server/auth/container";
import type { Logger, SecurityEvent } from "@/server/observability/logger";

class CapturingLogger implements Logger {
  events: SecurityEvent[] = [];
  log(): void {}
  security(e: SecurityEvent): void {
    this.events.push(e);
  }
}

const VALID = { name: "Deniz", username: "deniz", email: "deniz@aura.social", password: "Str0ngPass!" };

function setup() {
  const logger = new CapturingLogger();
  const deps = { ...buildInMemoryDeps(), logger } as AuthDeps;
  return { service: new AuthService(deps), logger };
}

describe("security instrumentation", () => {
  it("logs a security event for unknown-user login (enumeration-safe path)", async () => {
    const { service, logger } = setup();
    await service.login({ email: "ghost@aura.social", password: "x" }).catch(() => {});
    expect(logger.events.some((e) => e.type === "login_failed")).toBe(true);
  });

  it("logs account_locked after threshold", async () => {
    const { service, logger } = setup();
    await service.register(VALID);
    for (let i = 0; i < 5; i++)
      await service.login({ email: VALID.email, password: "wrong" }, { ipAddress: `10.0.0.${i}` }).catch(() => {});
    expect(logger.events.some((e) => e.type === "account_locked")).toBe(true);
  });

  it("logs token_reuse_detected on refresh replay", async () => {
    const { service, logger } = setup();
    await service.register(VALID);
    const first = await service.login({ email: VALID.email, password: VALID.password });
    await service.refresh(first.refreshToken);
    await service.refresh(first.refreshToken).catch(() => {});
    expect(logger.events.some((e) => e.type === "token_reuse_detected")).toBe(true);
  });

  it("unknown-user login does not throw and returns generic error (no enumeration)", async () => {
    const { service } = setup();
    await expect(service.login({ email: "ghost@aura.social", password: "x" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });
});
