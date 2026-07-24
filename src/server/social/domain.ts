/**
 * Social (takip) domain katmanı — kullanıcı grafiği. feed/auth'tan bağımsız
 * (Dependency Inversion); auth'un `UserRepository`sini profil verisi için kullanır.
 */

export interface FollowRepository {
  exists(followerId: string, followingId: string): Promise<boolean>;
  add(followerId: string, followingId: string): Promise<boolean>; // true = yeni eklendi
  remove(followerId: string, followingId: string): Promise<boolean>; // true = mevcuttu ve silindi
  countFollowers(userId: string): Promise<number>;
  countFollowing(userId: string): Promise<number>;
}

/** Arama sonucu satırı — profilin hafif bir alt kümesi (sayaç yok). */
export interface UserResult {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
  followedByMe: boolean;
  isMe: boolean;
}

/** Herkese açık profil görünümü — istemciye dönmeden önce servis tarafından zenginleştirilir. */
export interface Profile {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
  postCount: number;
  followerCount: number;
  followingCount: number;
  followedByMe: boolean;
  isMe: boolean;
}
