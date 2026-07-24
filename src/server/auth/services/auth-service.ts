/**
 * AuthService — kimlik doğrulamanın çekirdek iş kuralları.
 * Tüm bağımlılıklar arayüz üzerinden enjekte edilir (Dependency Inversion),
 * bu sayede Prisma olmadan tamamen test edilebilir.
 */
import type {
  UserRepository, SessionRepository, TokenRepository, LoginAttemptRepository, User, Session,
} from "@/server/auth/domain";
import type { RateLimiter } from "@/server/rate-limit/rate-limiter";
import type { Mailer } from "@/server/auth/mailer";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { generateToken, hashToken } from "@/server/auth/tokens";
import { verifyTotp } from "@/server/auth/totp";
import { AuthError } from "@/server/auth/errors";
import type { Logger } from "@/server/observability/logger";

// Kullanıcı bulunamadığında da hash doğrulaması çalıştırılır (timing attack / enumeration önleme).
// Sabit, geçersiz bir scrypt hash'i; hiçbir gerçek şifre bununla eşleşmez.
const DUMMY_HASH =
  "scrypt$16384$8$1$00000000000000000000000000000000$" +
  "0".repeat(128);

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 dk
const SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export interface AuthDeps {
  users: UserRepository;
  sessions: SessionRepository;
  emailTokens: TokenRepository;
  resetTokens: TokenRepository;
  loginAttempts: LoginAttemptRepository;
  loginRateLimiter: RateLimiter;
  mailer: Mailer;
  logger?: Logger;
  now?: () => Date;
}

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface LoginResult {
  user: User;
  session: Session;
  refreshToken: string; // düz token — yalnızca çağırana döner, cookie'ye konur
}

export class AuthService {
  private now: () => Date;
  constructor(private readonly deps: AuthDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  /* --------------------------- Kayıt --------------------------- */
  async register(input: { name: string; username: string; email: string; password: string }): Promise<User> {
    const email = input.email.toLowerCase();
    const username = input.username.toLowerCase();
    if (await this.deps.users.findByEmail(email)) throw new AuthError("EMAIL_TAKEN", "Bu e-posta zaten kayıtlı.");
    if (await this.deps.users.findByUsername(username))
      throw new AuthError("USERNAME_TAKEN", "Bu kullanıcı adı alınmış.");

    const passwordHash = await hashPassword(input.password);
    const user = await this.deps.users.create({ name: input.name, username, email, passwordHash });
    await this.issueEmailVerification(user);
    return user;
  }

  /* --------------------- E-posta doğrulama --------------------- */
  async issueEmailVerification(user: User): Promise<void> {
    const token = generateToken();
    await this.deps.emailTokens.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(this.now().getTime() + VERIFY_TTL_MS),
    });
    // Token zaten kalıcı; sağlayıcı hatası (rate limit, geçici kesinti) kayıt
    // akışını düşürmesin — kullanıcı hesabı oluşur, e-posta arka planda başarısız olur.
    try {
      await this.deps.mailer.sendVerificationEmail(user.email, token);
    } catch (err) {
      this.deps.logger?.log("error", "mailer.sendVerificationEmail failed", {
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await this.deps.emailTokens.findByHash(hashToken(token));
    if (!record || record.consumedAt) throw new AuthError("INVALID_TOKEN", "Geçersiz doğrulama bağlantısı.");
    if (record.expiresAt < this.now()) throw new AuthError("TOKEN_EXPIRED", "Doğrulama bağlantısının süresi dolmuş.");
    await this.deps.emailTokens.consume(record.id);
    await this.deps.users.update(record.userId, { emailVerified: this.now() });
  }

  /* --------------------------- Giriş --------------------------- */
  async login(
    input: { email: string; password: string; rememberMe?: boolean; totp?: string },
    ctx: RequestContext = {}
  ): Promise<LoginResult> {
    const email = input.email.toLowerCase();

    const rl = await this.deps.loginRateLimiter.consume(`login:${ctx.ipAddress ?? "unknown"}:${email}`);
    if (!rl.allowed) {
      this.deps.logger?.security({ type: "rate_limited", ip: ctx.ipAddress, meta: { email } });
      throw new AuthError("RATE_LIMITED", "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.");
    }

    const user = await this.deps.users.findByEmail(email);
    // Timing attack / enumeration önleme: kullanıcı yoksa da eşdeğer maliyetli bir
    // hash doğrulaması çalıştırılır ki yanıt süresi kullanıcının varlığını sızdırmasın.
    if (!user) {
      await verifyPassword(input.password, DUMMY_HASH);
      await this.recordFailure(email, ctx);
      this.deps.logger?.security({ type: "login_failed", ip: ctx.ipAddress, meta: { reason: "no_user" } });
      throw new AuthError("INVALID_CREDENTIALS", "E-posta veya şifre hatalı.");
    }
    if (user.lockedUntil && user.lockedUntil > this.now()) {
      throw new AuthError("ACCOUNT_LOCKED", "Hesap geçici olarak kilitlendi. Lütfen sonra deneyin.");
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      await this.registerFailedAttempt(user, email, ctx);
      this.deps.logger?.security({ type: "login_failed", userId: user.id, ip: ctx.ipAddress });
      throw new AuthError("INVALID_CREDENTIALS", "E-posta veya şifre hatalı.");
    }

    if (user.twoFactorEnabled) {
      if (!input.totp) throw new AuthError("TWO_FACTOR_REQUIRED", "İki adımlı doğrulama kodu gerekli.");
      if (!user.twoFactorSecret || !verifyTotp(user.twoFactorSecret, input.totp))
        throw new AuthError("TWO_FACTOR_INVALID", "Doğrulama kodu hatalı.");
    }

    // Başarılı: sayaçları sıfırla
    if (user.failedLoginCount > 0 || user.lockedUntil)
      await this.deps.users.update(user.id, { failedLoginCount: 0, lockedUntil: null });
    await this.deps.loginAttempts.record(email, ctx.ipAddress ?? null, true);
    this.deps.logger?.security({ type: "login_success", userId: user.id, ip: ctx.ipAddress });

    const { session, refreshToken } = await this.createSession(user, Boolean(input.rememberMe), ctx);
    return { user, session, refreshToken };
  }

  private async registerFailedAttempt(user: User, email: string, ctx: RequestContext): Promise<void> {
    const failed = user.failedLoginCount + 1;
    const patch: Partial<User> = { failedLoginCount: failed };
    if (failed >= MAX_FAILED) {
      patch.lockedUntil = new Date(this.now().getTime() + LOCK_MS);
      patch.failedLoginCount = 0;
      this.deps.logger?.security({ type: "account_locked", userId: user.id, ip: ctx.ipAddress });
    }
    await this.deps.users.update(user.id, patch);
    await this.recordFailure(email, ctx);
  }

  private async recordFailure(email: string, ctx: RequestContext): Promise<void> {
    await this.deps.loginAttempts.record(email, ctx.ipAddress ?? null, false);
  }

  /* --------------------- Oturum / rotasyon --------------------- */
  private async createSession(
    user: User,
    rememberMe: boolean,
    ctx: RequestContext,
    previousTokenHash: string | null = null
  ): Promise<{ session: Session; refreshToken: string }> {
    const refreshToken = generateToken(48);
    const ttl = rememberMe ? REMEMBER_MS : SESSION_MS;
    const session = await this.deps.sessions.create({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      previousTokenHash,
      userAgent: ctx.userAgent ?? null,
      ipAddress: ctx.ipAddress ?? null,
      deviceLabel: deriveDeviceLabel(ctx.userAgent ?? null),
      rememberMe,
      expiresAt: new Date(this.now().getTime() + ttl),
    });
    return { session, refreshToken };
  }

  /** Refresh token rotation + reuse-detection. */
  async refresh(refreshToken: string, ctx: RequestContext = {}): Promise<LoginResult> {
    const hash = hashToken(refreshToken);
    const session = await this.deps.sessions.findByRefreshHash(hash);
    if (!session) throw new AuthError("SESSION_INVALID", "Oturum geçersiz.");

    // Reuse-detection: iptal edilmiş bir token yeniden kullanılırsa → tüm oturumları düşür
    if (session.revokedAt) {
      await this.deps.sessions.revokeAllForUser(session.userId);
      this.deps.logger?.security({ type: "token_reuse_detected", userId: session.userId, ip: ctx.ipAddress });
      throw new AuthError("TOKEN_REUSE_DETECTED", "Güvenlik nedeniyle tüm oturumlar sonlandırıldı.");
    }
    if (session.expiresAt < this.now()) {
      await this.deps.sessions.revoke(session.id);
      throw new AuthError("SESSION_INVALID", "Oturum süresi dolmuş.");
    }

    const user = await this.deps.users.findById(session.userId);
    if (!user) throw new AuthError("SESSION_INVALID", "Kullanıcı bulunamadı.");

    // Eski oturumu iptal et, yenisini zincirle
    await this.deps.sessions.revoke(session.id);
    const { session: fresh, refreshToken: newToken } = await this.createSession(
      user,
      session.rememberMe,
      ctx,
      session.refreshTokenHash
    );
    return { user, session: fresh, refreshToken: newToken };
  }

  /* ------------------ Salt okuma yardımcıları ------------------ */
  /** Refresh token'dan geçerli (iptal edilmemiş, süresi geçmemiş) oturumu döndürür. */
  async getValidSessionByToken(refreshToken: string): Promise<Session | null> {
    const session = await this.deps.sessions.findByRefreshHash(hashToken(refreshToken));
    if (!session || session.revokedAt || session.expiresAt < this.now()) return null;
    return session;
  }
  async getUserById(id: string): Promise<User | null> {
    return this.deps.users.findById(id);
  }
  async getUserByUsername(username: string): Promise<User | null> {
    return this.deps.users.findByUsername(username);
  }
  async searchUsers(query: string, limit: number): Promise<User[]> {
    return this.deps.users.searchUsers(query, limit);
  }

  /* --------------------------- Profil / şifre ayarları --------------------------- */
  async updateProfile(
    userId: string,
    input: { name: string; username: string; avatarUrl?: string | null }
  ): Promise<User> {
    const name = input.name.trim();
    if (name.length < 2 || name.length > 60) throw new AuthError("INVALID_INPUT", "İsim 2-60 karakter olmalı.");
    const username = input.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(username))
      throw new AuthError("INVALID_INPUT", "Kullanıcı adı 3-24 karakter; yalnızca harf, rakam ve alt çizgi.");
    const existing = await this.deps.users.findByUsername(username);
    if (existing && existing.id !== userId) throw new AuthError("USERNAME_TAKEN", "Bu kullanıcı adı alınmış.");
    const data: Partial<User> = { name, username };
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
    return this.deps.users.update(userId, data);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.deps.users.findById(userId);
    if (!user) throw new AuthError("USER_NOT_FOUND", "Kullanıcı bulunamadı.");
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw new AuthError("INVALID_PASSWORD", "Mevcut şifre hatalı.");
    if (newPassword.length < 8) throw new AuthError("INVALID_INPUT", "Yeni şifre en az 8 karakter olmalı.");
    const passwordHash = await hashPassword(newPassword);
    await this.deps.users.update(userId, { passwordHash, failedLoginCount: 0, lockedUntil: null });
  }

  /** Hesabı kalıcı olarak siler (şifre doğrulaması sonrası; ilişkili veri FK cascade ile gider). */
  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.deps.users.findById(userId);
    if (!user) throw new AuthError("USER_NOT_FOUND", "Kullanıcı bulunamadı.");
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new AuthError("INVALID_PASSWORD", "Şifre hatalı.");
    await this.deps.users.delete(userId);
  }

  /* --------------------------- Çıkış --------------------------- */
  async logout(refreshToken: string): Promise<void> {
    const session = await this.deps.sessions.findByRefreshHash(hashToken(refreshToken));
    if (session) await this.deps.sessions.revoke(session.id);
  }

  /* ---------------- Cihaz oturumları yönetimi ---------------- */
  async listSessions(userId: string): Promise<Session[]> {
    return this.deps.sessions.listByUser(userId);
  }
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const all = await this.deps.sessions.listByUser(userId);
    if (all.some((s) => s.id === sessionId)) await this.deps.sessions.revoke(sessionId);
  }
  async revokeOtherSessions(userId: string, keepSessionId: string): Promise<void> {
    await this.deps.sessions.revokeAllForUser(userId, keepSessionId);
  }

  /* --------------------- Şifre sıfırlama --------------------- */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.deps.users.findByEmail(email.toLowerCase());
    // Enumeration önleme: kullanıcı yoksa da sessizce başarı dön
    if (!user) return;
    const token = generateToken();
    await this.deps.resetTokens.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(this.now().getTime() + RESET_TTL_MS),
    });
    try {
      await this.deps.mailer.sendPasswordResetEmail(user.email, token);
    } catch (err) {
      this.deps.logger?.log("error", "mailer.sendPasswordResetEmail failed", {
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.deps.resetTokens.findByHash(hashToken(token));
    if (!record || record.consumedAt) throw new AuthError("INVALID_TOKEN", "Geçersiz sıfırlama bağlantısı.");
    if (record.expiresAt < this.now()) throw new AuthError("TOKEN_EXPIRED", "Bağlantının süresi dolmuş.");
    const passwordHash = await hashPassword(newPassword);
    await this.deps.users.update(record.userId, { passwordHash, failedLoginCount: 0, lockedUntil: null });
    await this.deps.resetTokens.consume(record.id);
    // Güvenlik: şifre değişince tüm oturumları düşür
    await this.deps.sessions.revokeAllForUser(record.userId);
    this.deps.logger?.security({ type: "password_reset", userId: record.userId });
  }
}

function deriveDeviceLabel(ua: string | null): string {
  if (!ua) return "Bilinmeyen cihaz";
  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua)) return "iPad";
  if (/android/i.test(ua)) return "Android";
  if (/macintosh|mac os/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows";
  if (/linux/i.test(ua)) return "Linux";
  return "Web";
}
