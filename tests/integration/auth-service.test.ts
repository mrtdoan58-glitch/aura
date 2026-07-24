import { describe, it, expect } from "vitest";
import { AuthService } from "@/server/auth/services/auth-service";
import { buildInMemoryDeps } from "@/server/auth/container";
import type { AuthDeps } from "@/server/auth/services/auth-service";
import type { ConsoleMailer } from "@/server/auth/mailer";
import { AuthError } from "@/server/auth/errors";

function setup() {
  const deps = buildInMemoryDeps() as AuthDeps;
  const service = new AuthService(deps);
  return { service, deps, mailer: deps.mailer as ConsoleMailer };
}

const VALID = { name: "Deniz", username: "deniz", email: "deniz@aura.social", password: "Str0ngPass!" };

describe("AuthService — registration", () => {
  it("registers a new user and sends verification email", async () => {
    const { service, mailer } = setup();
    const user = await service.register(VALID);
    expect(user.email).toBe("deniz@aura.social");
    expect(user.emailVerified).toBeNull();
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].type).toBe("verify");
  });

  it("rejects duplicate email", async () => {
    const { service } = setup();
    await service.register(VALID);
    await expect(service.register({ ...VALID, username: "other" })).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  });

  it("rejects duplicate username", async () => {
    const { service } = setup();
    await service.register(VALID);
    await expect(service.register({ ...VALID, email: "x@aura.social" })).rejects.toMatchObject({ code: "USERNAME_TAKEN" });
  });
});

describe("AuthService — email verification", () => {
  it("verifies email with a valid token", async () => {
    const { service, deps, mailer } = setup();
    const user = await service.register(VALID);
    await service.verifyEmail(mailer.sent[0].token);
    const updated = await deps.users.findById(user.id);
    expect(updated?.emailVerified).not.toBeNull();
  });

  it("rejects an invalid token", async () => {
    const { service } = setup();
    await expect(service.verifyEmail("bogus")).rejects.toMatchObject({ code: "INVALID_TOKEN" });
  });
});

describe("AuthService — login", () => {
  it("logs in with correct credentials and issues a session", async () => {
    const { service } = setup();
    await service.register(VALID);
    const res = await service.login({ email: VALID.email, password: VALID.password });
    expect(res.user.email).toBe(VALID.email);
    expect(res.refreshToken).toBeTruthy();
    expect(res.session.revokedAt).toBeNull();
  });

  it("rejects wrong password", async () => {
    const { service } = setup();
    await service.register(VALID);
    await expect(service.login({ email: VALID.email, password: "nope" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("does not reveal whether an email exists", async () => {
    const { service } = setup();
    await expect(service.login({ email: "ghost@aura.social", password: "x" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("locks the account after 5 failed attempts", async () => {
    const { service, deps } = setup();
    const u = await service.register(VALID);
    // Farklı IP'ler kullan: rate-limiter (ip+email anahtarlı) tetiklenmesin, sadece hesap kilidini test edelim
    for (let i = 0; i < 5; i++) {
      await service
        .login({ email: VALID.email, password: "wrong" }, { ipAddress: `10.0.0.${i}` })
        .catch(() => {});
    }
    const locked = await deps.users.findById(u.id);
    expect(locked?.lockedUntil).not.toBeNull();
    await expect(
      service.login({ email: VALID.email, password: VALID.password }, { ipAddress: "10.0.0.99" })
    ).rejects.toMatchObject({ code: "ACCOUNT_LOCKED" });
  });

  it("rate-limits excessive attempts from same key", async () => {
    const { service } = setup();
    await service.register(VALID);
    let rateLimited = false;
    for (let i = 0; i < 8; i++) {
      try {
        await service.login({ email: VALID.email, password: "wrong" }, { ipAddress: "1.1.1.1" });
      } catch (e) {
        if (e instanceof AuthError && e.code === "RATE_LIMITED") rateLimited = true;
      }
    }
    expect(rateLimited).toBe(true);
  });
});

describe("AuthService — refresh token rotation", () => {
  it("rotates the token and invalidates the old one", async () => {
    const { service } = setup();
    await service.register(VALID);
    const first = await service.login({ email: VALID.email, password: VALID.password });
    const rotated = await service.refresh(first.refreshToken);
    expect(rotated.refreshToken).not.toBe(first.refreshToken);
    // old token no longer valid
    await expect(service.refresh(first.refreshToken)).rejects.toMatchObject({ code: "TOKEN_REUSE_DETECTED" });
  });

  it("reuse-detection revokes all sessions", async () => {
    const { service, deps } = setup();
    const u = await service.register(VALID);
    const first = await service.login({ email: VALID.email, password: VALID.password });
    await service.refresh(first.refreshToken); // rotate; old is revoked
    await service.refresh(first.refreshToken).catch(() => {}); // reuse → nuke all
    const sessions = await deps.sessions.listByUser(u.id);
    expect(sessions).toHaveLength(0);
  });
});

describe("AuthService — sessions (devices)", () => {
  it("lists active sessions and revokes one", async () => {
    const { service } = setup();
    const u = await service.register(VALID);
    await service.login({ email: VALID.email, password: VALID.password });
    await service.login({ email: VALID.email, password: VALID.password });
    let sessions = await service.listSessions(u.id);
    expect(sessions.length).toBe(2);
    await service.revokeSession(u.id, sessions[0].id);
    sessions = await service.listSessions(u.id);
    expect(sessions.length).toBe(1);
  });

  it("logout revokes the session", async () => {
    const { service } = setup();
    const u = await service.register(VALID);
    const res = await service.login({ email: VALID.email, password: VALID.password });
    await service.logout(res.refreshToken);
    expect(await service.listSessions(u.id)).toHaveLength(0);
  });
});

describe("AuthService — password reset", () => {
  it("issues reset token only for existing users but never reveals it", async () => {
    const { service, mailer } = setup();
    await service.register(VALID);
    await service.requestPasswordReset(VALID.email);
    await service.requestPasswordReset("ghost@aura.social");
    const resets = mailer.sent.filter((m) => m.type === "reset");
    expect(resets).toHaveLength(1);
  });

  it("resets the password and revokes sessions", async () => {
    const { service, mailer } = setup();
    const u = await service.register(VALID);
    await service.login({ email: VALID.email, password: VALID.password });
    await service.requestPasswordReset(VALID.email);
    const token = mailer.sent.find((m) => m.type === "reset")!.token;
    await service.resetPassword(token, "N3wStrongPass!");
    expect(await service.listSessions(u.id)).toHaveLength(0);
    const res = await service.login({ email: VALID.email, password: "N3wStrongPass!" });
    expect(res.user.id).toBe(u.id);
  });
});

describe("AuthService — updateProfile", () => {
  it("updates name, username and avatar", async () => {
    const { service, deps } = setup();
    const u = await service.register(VALID);
    const updated = await service.updateProfile(u.id, { name: "Yeni Ad", username: "yeniad", avatarUrl: "https://x/y.png" });
    expect(updated.name).toBe("Yeni Ad");
    expect(updated.username).toBe("yeniad");
    expect(updated.avatarUrl).toBe("https://x/y.png");
    expect((await deps.users.findByUsername("yeniad"))?.id).toBe(u.id);
  });

  it("rejects a username already taken by someone else", async () => {
    const { service } = setup();
    await service.register(VALID);
    const other = await service.register({ ...VALID, username: "other", email: "other@aura.social" });
    await expect(service.updateProfile(other.id, { name: "Xavier", username: "deniz" })).rejects.toMatchObject({ code: "USERNAME_TAKEN" });
  });

  it("rejects an invalid username", async () => {
    const { service } = setup();
    const u = await service.register(VALID);
    await expect(service.updateProfile(u.id, { name: "Xavier", username: "ab" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});

describe("AuthService — changePassword", () => {
  it("changes the password when the current one is correct", async () => {
    const { service } = setup();
    const u = await service.register(VALID);
    await service.changePassword(u.id, VALID.password, "Br4ndNewPass!");
    await expect(service.login({ email: VALID.email, password: VALID.password })).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    const res = await service.login({ email: VALID.email, password: "Br4ndNewPass!" });
    expect(res.user.id).toBe(u.id);
  });

  it("rejects a wrong current password", async () => {
    const { service } = setup();
    const u = await service.register(VALID);
    await expect(service.changePassword(u.id, "WrongCurrent1!", "Br4ndNewPass!")).rejects.toMatchObject({ code: "INVALID_PASSWORD" });
  });

  it("rejects a too-short new password", async () => {
    const { service } = setup();
    const u = await service.register(VALID);
    await expect(service.changePassword(u.id, VALID.password, "short")).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});

describe("AuthService — deleteAccount", () => {
  it("deletes the account after password check; login then fails", async () => {
    const { service, deps } = setup();
    const u = await service.register(VALID);
    await service.deleteAccount(u.id, VALID.password);
    expect(await deps.users.findById(u.id)).toBeNull();
    await expect(service.login({ email: VALID.email, password: VALID.password })).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("rejects deletion with a wrong password", async () => {
    const { service, deps } = setup();
    const u = await service.register(VALID);
    await expect(service.deleteAccount(u.id, "WrongPass1!")).rejects.toMatchObject({ code: "INVALID_PASSWORD" });
    expect(await deps.users.findById(u.id)).not.toBeNull();
  });
});
