/**
 * Auth domain katmanı — çerçeveden ve altyapıdan bağımsız.
 * Entity'ler ve repository arayüzleri burada tanımlanır (Dependency Inversion).
 * Somut implementasyonlar (Prisma / in-memory) bu arayüzleri uygular.
 */

export type Role = "USER" | "MODERATOR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  passwordHash: string;
  role: Role;
  emailVerified: Date | null;
  avatarUrl: string | null;
  failedLoginCount: number;
  lockedUntil: Date | null;
  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  previousTokenHash: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  deviceLabel: string | null;
  rememberMe: boolean;
  expiresAt: Date;
  lastUsedAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface VerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string | null;
  success: boolean;
  createdAt: Date;
}

/* ----------------------------- Repository arayüzleri ----------------------------- */

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  /** username veya name içinde (harf-duyarsız) geçenler; en fazla `limit` kayıt. */
  searchUsers(query: string, limit: number): Promise<User[]>;
  create(data: NewUser): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

export interface NewUser {
  email: string;
  username: string;
  name: string;
  passwordHash: string;
  role?: Role;
}

export interface SessionRepository {
  create(data: NewSession): Promise<Session>;
  findByRefreshHash(hash: string): Promise<Session | null>;
  listByUser(userId: string): Promise<Session[]>;
  update(id: string, data: Partial<Session>): Promise<Session>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string, exceptId?: string): Promise<void>;
}

export interface NewSession {
  userId: string;
  refreshTokenHash: string;
  previousTokenHash?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceLabel?: string | null;
  rememberMe: boolean;
  expiresAt: Date;
}

export interface TokenRepository {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<VerificationToken>;
  findByHash(hash: string): Promise<VerificationToken | null>;
  consume(id: string): Promise<void>;
  deleteForUser(userId: string): Promise<void>;
}

export interface LoginAttemptRepository {
  record(email: string, ip: string | null, success: boolean): Promise<void>;
  countRecentFailures(email: string, since: Date): Promise<number>;
}
