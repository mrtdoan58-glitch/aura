/**
 * Feed domain katmanı — entity'ler, cursor sayfalama tipleri ve repository arayüzleri.
 * Altyapıdan bağımsız (Dependency Inversion).
 */

export interface Author {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
}

export type MediaType = "image" | "video";

export interface Media {
  id: string;
  type: MediaType;
  url: string;
  posterUrl: string | null; // video için kapak
  width: number;
  height: number;
  blurDataUrl: string | null; // LQIP
  order: number;
}

export interface Post {
  id: string;
  author: Author;
  media: Media[];
  caption: string;
  tags: string[];
  location: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
}

/** İstemciye dönen, kullanıcının etkileşim durumunu içeren zenginleştirilmiş gönderi. */
export interface PostView extends Post {
  likedByMe: boolean;
  savedByMe: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  author: Author;
  text: string;
  likeCount: number;
  createdAt: Date;
}

export interface Story {
  id: string;
  author: Author;
  media: Media;
  createdAt: Date;
  expiresAt: Date;
  seenByMe: boolean;
}

/* ------------------------- Cursor sayfalama ------------------------- */

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface CursorParams {
  cursor?: string | null;
  limit: number;
}

/* ------------------------- Repository arayüzleri ------------------------- */

export interface NewPostMedia {
  type: MediaType;
  url: string;
  posterUrl: string | null;
  width: number;
  height: number;
  blurDataUrl: string | null;
}

export interface PostRepository {
  /** Zaman-sıralı feed; cursor = son gönderinin `createdAt|id` bileşik anahtarı. */
  listFeed(params: CursorParams): Promise<CursorPage<Post>>;
  /** Bir kullanıcının profil ızgarası — aynı cursor semantiği, authorId ile filtreli. */
  listByAuthor(authorId: string, params: CursorParams): Promise<CursorPage<Post>>;
  countByAuthor(authorId: string): Promise<number>;
  findById(id: string): Promise<Post | null>;
  incrementLikeCount(id: string, delta: number): Promise<void>;
  incrementCommentCount(id: string, delta: number): Promise<void>;
  create(data: { author: Author; caption: string; tags: string[]; location: string | null; media: NewPostMedia[] }): Promise<Post>;
}

export interface LikeRepository {
  exists(userId: string, postId: string): Promise<boolean>;
  add(userId: string, postId: string): Promise<boolean>; // true = yeni eklendi
  remove(userId: string, postId: string): Promise<boolean>; // true = mevcuttu ve silindi
  filterLiked(userId: string, postIds: string[]): Promise<Set<string>>;
}

export interface SaveRepository {
  exists(userId: string, postId: string): Promise<boolean>;
  add(userId: string, postId: string): Promise<boolean>;
  remove(userId: string, postId: string): Promise<boolean>;
  filterSaved(userId: string, postIds: string[]): Promise<Set<string>>;
  listSaved(userId: string, params: CursorParams): Promise<CursorPage<Post>>;
}

export interface CommentRepository {
  listByPost(postId: string, params: CursorParams): Promise<CursorPage<Comment>>;
  add(data: { postId: string; author: Author; text: string }): Promise<Comment>;
  countByPost(postId: string): Promise<number>;
}

export interface StoryRepository {
  listActive(now: Date, viewerId: string | null): Promise<Story[]>;
  markSeen(storyId: string, viewerId: string): Promise<void>;
  create(data: { author: Author; mediaUrl: string; type: MediaType; expiresAt: Date }): Promise<Story>;
}
