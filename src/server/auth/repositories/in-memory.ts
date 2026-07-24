/**
 * In-memory repository implementasyonları — testler ve yerel geliştirme için.
 * Prisma implementasyonu ile birebir aynı arayüzleri uygular (Liskov).
 */
import { randomUUID } from "node:crypto";
import type {
  User, Session, VerificationToken, NewUser, NewSession,
  UserRepository, SessionRepository, TokenRepository, LoginAttemptRepository, LoginAttempt,
} from "@/server/auth/domain";

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }
  async findByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email.toLowerCase()) ?? null;
  }
  async findByUsername(username: string) {
    return [...this.users.values()].find((u) => u.username === username.toLowerCase()) ?? null;
  }
  async searchUsers(query: string, limit: number): Promise<User[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [...this.users.values()]
      .filter((u) => u.username.includes(q) || u.name.toLowerCase().includes(q))
      .sort((a, b) => a.username.localeCompare(b.username))
      .slice(0, Math.max(1, limit));
  }
  async create(data: NewUser): Promise<User> {
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role ?? "USER",
      emailVerified: null,
      avatarUrl: null,
      failedLoginCount: 0,
      lockedUntil: null,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }
  async update(id: string, data: Partial<User>): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) throw new Error("User not found");
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }
  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}

export class InMemorySessionRepository implements SessionRepository {
  private sessions = new Map<string, Session>();

  async create(data: NewSession): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      userId: data.userId,
      refreshTokenHash: data.refreshTokenHash,
      previousTokenHash: data.previousTokenHash ?? null,
      userAgent: data.userAgent ?? null,
      ipAddress: data.ipAddress ?? null,
      deviceLabel: data.deviceLabel ?? null,
      rememberMe: data.rememberMe,
      expiresAt: data.expiresAt,
      lastUsedAt: new Date(),
      revokedAt: null,
      createdAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }
  async findByRefreshHash(hash: string) {
    return [...this.sessions.values()].find((s) => s.refreshTokenHash === hash) ?? null;
  }
  async listByUser(userId: string) {
    return [...this.sessions.values()]
      .filter((s) => s.userId === userId && !s.revokedAt)
      .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
  }
  async update(id: string, data: Partial<Session>): Promise<Session> {
    const existing = this.sessions.get(id);
    if (!existing) throw new Error("Session not found");
    const updated = { ...existing, ...data };
    this.sessions.set(id, updated);
    return updated;
  }
  async revoke(id: string): Promise<void> {
    const s = this.sessions.get(id);
    if (s) this.sessions.set(id, { ...s, revokedAt: new Date() });
  }
  async revokeAllForUser(userId: string, exceptId?: string): Promise<void> {
    for (const [id, s] of this.sessions) {
      if (s.userId === userId && id !== exceptId) this.sessions.set(id, { ...s, revokedAt: new Date() });
    }
  }
}

export class InMemoryTokenRepository implements TokenRepository {
  private tokens = new Map<string, VerificationToken>();

  async create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<VerificationToken> {
    const token: VerificationToken = {
      id: randomUUID(),
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      consumedAt: null,
      createdAt: new Date(),
    };
    this.tokens.set(token.id, token);
    return token;
  }
  async findByHash(hash: string) {
    return [...this.tokens.values()].find((t) => t.tokenHash === hash) ?? null;
  }
  async consume(id: string): Promise<void> {
    const t = this.tokens.get(id);
    if (t) this.tokens.set(id, { ...t, consumedAt: new Date() });
  }
  async deleteForUser(userId: string): Promise<void> {
    for (const [id, t] of this.tokens) if (t.userId === userId) this.tokens.delete(id);
  }
}

export class InMemoryLoginAttemptRepository implements LoginAttemptRepository {
  private attempts: LoginAttempt[] = [];

  async record(email: string, ip: string | null, success: boolean): Promise<void> {
    this.attempts.push({ id: randomUUID(), email: email.toLowerCase(), ipAddress: ip, success, createdAt: new Date() });
  }
  async countRecentFailures(email: string, since: Date): Promise<number> {
    return this.attempts.filter((a) => a.email === email.toLowerCase() && !a.success && a.createdAt >= since).length;
  }
}
