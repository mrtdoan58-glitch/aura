/** İstemci tarafı DTO'ları — API JSON'unda tarihler ISO string olarak gelir. */
export interface AuthorDTO {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
}
export interface MediaDTO {
  id: string;
  type: "image" | "video";
  url: string;
  posterUrl: string | null;
  width: number;
  height: number;
  blurDataUrl: string | null;
  order: number;
}
export interface PostDTO {
  id: string;
  author: AuthorDTO;
  media: MediaDTO[];
  caption: string;
  tags: string[];
  location: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  likedByMe: boolean;
  savedByMe: boolean;
}
export interface CommentDTO {
  id: string;
  postId: string;
  parentId: string | null;
  author: AuthorDTO;
  text: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
}
export interface StoryDTO {
  id: string;
  author: AuthorDTO;
  media: MediaDTO;
  createdAt: string;
  expiresAt: string;
  seenByMe: boolean;
}
export interface CursorPageDTO<T> {
  items: T[];
  nextCursor: string | null;
}
