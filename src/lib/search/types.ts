/** Arama istemci DTO'ları — bkz. lib/feed/types.ts (server/client sınırı deseni). */
import type { PostDTO } from "@/lib/feed/types";

export interface UserResultDTO {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
  followedByMe: boolean;
  isMe: boolean;
}

export interface SearchResultsDTO {
  users: UserResultDTO[];
  posts: PostDTO[];
}
