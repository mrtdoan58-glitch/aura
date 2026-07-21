/**
 * Prisma Follow repository (üretim). `prisma generate` gerektirir;
 * typecheck kapsamı dışında (bkz. tsconfig.json).
 */
import { prisma } from "@/server/db/prisma";
import type { FollowRepository } from "@/server/social/domain";

function isUniqueConstraintError(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === "P2002";
}

export class PrismaFollowRepository implements FollowRepository {
  async exists(followerId: string, followingId: string): Promise<boolean> {
    const row = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId, followingId } } });
    return row !== null;
  }
  async add(followerId: string, followingId: string): Promise<boolean> {
    try {
      await prisma.follow.create({ data: { followerId, followingId } });
      return true;
    } catch (e) {
      if (isUniqueConstraintError(e)) return false;
      throw e;
    }
  }
  async remove(followerId: string, followingId: string): Promise<boolean> {
    const res = await prisma.follow.deleteMany({ where: { followerId, followingId } });
    return res.count > 0;
  }
  async countFollowers(userId: string): Promise<number> {
    return prisma.follow.count({ where: { followingId: userId } });
  }
  async countFollowing(userId: string): Promise<number> {
    return prisma.follow.count({ where: { followerId: userId } });
  }
}
