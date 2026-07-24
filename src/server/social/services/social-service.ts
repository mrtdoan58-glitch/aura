/**
 * SocialService — takip ilişkisi ve herkese açık profil iş kuralları.
 * Bağımlılıklar arayüzle enjekte edilir; Prisma olmadan test edilebilir.
 */
import type { FollowRepository, Profile, UserResult } from "@/server/social/domain";
import type { User } from "@/server/auth/domain";

const DEFAULT_AVATAR = "https://i.pravatar.cc/200?img=68";

export interface PostCounter {
  countPostsByAuthor(authorId: string): Promise<number>;
}

/**
 * Kullanıcı arama için ayrı bir UserRepository/store enjekte etmek yerine,
 * zaten var olan AuthService singleton'ının (in-memory ya da Prisma) bu iki
 * metodunu yeniden kullanıyoruz — böylece iki paralel kullanıcı deposu olmaz.
 */
export interface UserLookup {
  getUserByUsername(username: string): Promise<User | null>;
  searchUsers(query: string, limit: number): Promise<User[]>;
}

export interface SocialDeps {
  follows: FollowRepository;
  users: UserLookup;
  posts: PostCounter;
}

export class SocialError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "INVALID_INPUT" | "UNAUTHENTICATED",
    message: string
  ) {
    super(message);
    this.name = "SocialError";
  }
}

export class SocialService {
  constructor(private readonly deps: SocialDeps) {}

  async getProfile(username: string, viewerId: string | null): Promise<Profile> {
    const user = await this.deps.users.getUserByUsername(username);
    if (!user) throw new SocialError("NOT_FOUND", "Kullanıcı bulunamadı.");
    const [postCount, followerCount, followingCount, followedByMe] = await Promise.all([
      this.deps.posts.countPostsByAuthor(user.id),
      this.deps.follows.countFollowers(user.id),
      this.deps.follows.countFollowing(user.id),
      viewerId && viewerId !== user.id ? this.deps.follows.exists(viewerId, user.id) : Promise.resolve(false),
    ]);
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl ?? DEFAULT_AVATAR,
      verified: user.role !== "USER",
      postCount,
      followerCount,
      followingCount,
      followedByMe,
      isMe: viewerId === user.id,
    };
  }

  /** Kullanıcı araması — her satır için viewer'ın takip/kendisi durumunu ekler. */
  async searchUsers(query: string, viewerId: string | null, limit = 10): Promise<UserResult[]> {
    const users = await this.deps.users.searchUsers(query, limit);
    return Promise.all(
      users.map(async (u): Promise<UserResult> => ({
        id: u.id,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatarUrl ?? DEFAULT_AVATAR,
        verified: u.role !== "USER",
        followedByMe:
          viewerId && viewerId !== u.id ? await this.deps.follows.exists(viewerId, u.id) : false,
        isMe: viewerId === u.id,
      }))
    );
  }

  async setFollow(
    followerId: string,
    targetUserId: string,
    follow: boolean
  ): Promise<{ following: boolean; followerCount: number }> {
    if (!followerId) throw new SocialError("UNAUTHENTICATED", "Giriş gerekli.");
    if (followerId === targetUserId) throw new SocialError("INVALID_INPUT", "Kendini takip edemezsin.");
    if (follow) await this.deps.follows.add(followerId, targetUserId);
    else await this.deps.follows.remove(followerId, targetUserId);
    const followerCount = await this.deps.follows.countFollowers(targetUserId);
    return { following: follow, followerCount };
  }
}
