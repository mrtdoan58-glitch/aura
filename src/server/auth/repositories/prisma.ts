/**
 * Prisma repository implementasyonları (üretim). In-memory ile aynı arayüzleri uygular.
 * `prisma generate` gerektirir; typecheck kapsamı dışında (bkz. prisma.ts notu).
 */
import { prisma } from "@/server/db/prisma";
import type {
  User, Session, VerificationToken, NewUser, NewSession,
  UserRepository, SessionRepository, TokenRepository, LoginAttemptRepository,
} from "@/server/auth/domain";

export class PrismaUserRepository implements UserRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } }) as Promise<User | null>;
  }
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } }) as Promise<User | null>;
  }
  findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username: username.toLowerCase() } }) as Promise<User | null>;
  }
  searchUsers(query: string, limit: number): Promise<User[]> {
    const q = query.trim();
    if (!q) return Promise.resolve([]);
    return prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { username: "asc" },
      take: Math.max(1, limit),
    }) as Promise<User[]>;
  }
  create(data: NewUser): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role ?? "USER",
      },
    }) as Promise<User>;
  }
  update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({ where: { id }, data }) as Promise<User>;
  }
}

export class PrismaSessionRepository implements SessionRepository {
  create(data: NewSession): Promise<Session> {
    return prisma.session.create({ data }) as Promise<Session>;
  }
  findByRefreshHash(hash: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { refreshTokenHash: hash } }) as Promise<Session | null>;
  }
  listByUser(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastUsedAt: "desc" },
    }) as Promise<Session[]>;
  }
  update(id: string, data: Partial<Session>): Promise<Session> {
    return prisma.session.update({ where: { id }, data }) as Promise<Session>;
  }
  async revoke(id: string): Promise<void> {
    await prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
  }
  async revokeAllForUser(userId: string, exceptId?: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      data: { revokedAt: new Date() },
    });
  }
}

/** İki token modeli aynı şekle sahip; ortak bir delegate arayüzüyle tekrar önlenir. */
interface TokenDelegate {
  create(args: { data: { userId: string; tokenHash: string; expiresAt: Date } }): Promise<VerificationToken>;
  findUnique(args: { where: { tokenHash: string } }): Promise<VerificationToken | null>;
  update(args: { where: { id: string }; data: { consumedAt: Date } }): Promise<unknown>;
  deleteMany(args: { where: { userId: string } }): Promise<unknown>;
}

function makeTokenRepo(model: "emailVerificationToken" | "passwordResetToken"): TokenRepository {
  const delegate = prisma[model] as unknown as TokenDelegate;
  return {
    create: (data) => delegate.create({ data }),
    findByHash: (hash) => delegate.findUnique({ where: { tokenHash: hash } }),
    consume: async (id) => {
      await delegate.update({ where: { id }, data: { consumedAt: new Date() } });
    },
    deleteForUser: async (userId) => {
      await delegate.deleteMany({ where: { userId } });
    },
  };
}
export const prismaEmailTokenRepository = makeTokenRepo("emailVerificationToken");
export const prismaResetTokenRepository = makeTokenRepo("passwordResetToken");

export class PrismaLoginAttemptRepository implements LoginAttemptRepository {
  async record(email: string, ip: string | null, success: boolean): Promise<void> {
    await prisma.loginAttempt.create({ data: { email: email.toLowerCase(), ipAddress: ip, success } });
  }
  countRecentFailures(email: string, since: Date): Promise<number> {
    return prisma.loginAttempt.count({
      where: { email: email.toLowerCase(), success: false, createdAt: { gte: since } },
    });
  }
}
