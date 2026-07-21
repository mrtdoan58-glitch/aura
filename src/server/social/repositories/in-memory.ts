/**
 * In-memory Follow repository — testler ve DB'siz dev için.
 * Prisma implementasyonu ile aynı arayüzü uygular (LSP).
 */
import type { FollowRepository } from "@/server/social/domain";

export class InMemoryFollowRepository implements FollowRepository {
  private set = new Set<string>();
  private key(followerId: string, followingId: string) {
    return `${followerId}:${followingId}`;
  }
  async exists(followerId: string, followingId: string) {
    return this.set.has(this.key(followerId, followingId));
  }
  async add(followerId: string, followingId: string) {
    const k = this.key(followerId, followingId);
    if (this.set.has(k)) return false;
    this.set.add(k);
    return true;
  }
  async remove(followerId: string, followingId: string) {
    return this.set.delete(this.key(followerId, followingId));
  }
  async countFollowers(userId: string) {
    let n = 0;
    for (const k of this.set) if (k.endsWith(`:${userId}`)) n++;
    return n;
  }
  async countFollowing(userId: string) {
    let n = 0;
    for (const k of this.set) if (k.startsWith(`${userId}:`)) n++;
    return n;
  }
}
