/** İstemci tarafı DTO'su — bkz. lib/feed/types.ts (server/client sınırını ayıran aynı desen). */
export interface ProfileDTO {
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
