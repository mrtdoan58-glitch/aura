/**
 * In-memory feed repository implementasyonları — testler ve DB'siz dev için.
 * Prisma implementasyonu ile birebir aynı arayüzleri uygular (LSP).
 */
import { randomUUID } from "node:crypto";
import type {
  Post, Comment, Story, Author, CursorParams, CursorPage, NewPostMedia,
  PostRepository, LikeRepository, SaveRepository, CommentRepository, StoryRepository,
} from "@/server/feed/domain";
import { encodeCursor, decodeCursor, isAfterCursor } from "@/server/feed/cursor";
import { seedPosts, seedStories } from "@/server/feed/seed";

/** Ortak, kararlı cursor sayfalama (createdAt DESC, id DESC). */
function paginate<T extends { id: string; createdAt: Date }>(all: T[], params: CursorParams): CursorPage<T> {
  const limit = Math.min(Math.max(params.limit, 1), 50);
  const sorted = [...all].sort((a, b) => {
    const t = b.createdAt.getTime() - a.createdAt.getTime();
    return t !== 0 ? t : (a.id < b.id ? 1 : -1);
  });
  const decoded = decodeCursor(params.cursor);
  const start = decoded ? sorted.filter((x) => isAfterCursor(x.createdAt, x.id, decoded)) : sorted;
  const items = start.slice(0, limit);
  const last = items[items.length - 1];
  const hasMore = start.length > items.length;
  return { items, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null };
}

export class InMemoryPostRepository implements PostRepository {
  private posts: Post[];
  constructor(seed = seedPosts()) {
    this.posts = seed;
  }
  async listFeed(params: CursorParams) {
    return paginate(this.posts, params);
  }
  async listByAuthor(authorId: string, params: CursorParams) {
    return paginate(this.posts.filter((p) => p.author.id === authorId), params);
  }
  async countByAuthor(authorId: string) {
    return this.posts.filter((p) => p.author.id === authorId).length;
  }
  async findById(id: string) {
    return this.posts.find((p) => p.id === id) ?? null;
  }
  async incrementLikeCount(id: string, delta: number) {
    const p = this.posts.find((x) => x.id === id);
    if (p) p.likeCount = Math.max(0, p.likeCount + delta);
  }
  async incrementCommentCount(id: string, delta: number) {
    const p = this.posts.find((x) => x.id === id);
    if (p) p.commentCount = Math.max(0, p.commentCount + delta);
  }
  async create(data: { author: Author; caption: string; tags: string[]; location: string | null; media: NewPostMedia[] }): Promise<Post> {
    const post: Post = {
      id: randomUUID(),
      author: data.author,
      media: data.media.map((m, order) => ({ ...m, id: randomUUID(), order })),
      caption: data.caption,
      tags: data.tags,
      location: data.location,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
    };
    this.posts.unshift(post);
    return post;
  }
  /** Test yardımcıları */
  all() {
    return this.posts;
  }
}

abstract class RelationRepo {
  protected set = new Set<string>();
  protected key(userId: string, postId: string) {
    return `${userId}:${postId}`;
  }
  async exists(userId: string, postId: string) {
    return this.set.has(this.key(userId, postId));
  }
  async add(userId: string, postId: string) {
    const k = this.key(userId, postId);
    if (this.set.has(k)) return false;
    this.set.add(k);
    return true;
  }
  async remove(userId: string, postId: string) {
    return this.set.delete(this.key(userId, postId));
  }
  protected filter(userId: string, postIds: string[]) {
    return new Set(postIds.filter((pid) => this.set.has(this.key(userId, pid))));
  }
}

export class InMemoryLikeRepository extends RelationRepo implements LikeRepository {
  async filterLiked(userId: string, postIds: string[]) {
    return this.filter(userId, postIds);
  }
}

export class InMemorySaveRepository extends RelationRepo implements SaveRepository {
  constructor(private readonly postRepo: InMemoryPostRepository) {
    super();
  }
  async filterSaved(userId: string, postIds: string[]) {
    return this.filter(userId, postIds);
  }
  async listSaved(userId: string, params: CursorParams): Promise<CursorPage<Post>> {
    const savedIds = new Set(
      [...this.set].filter((k) => k.startsWith(`${userId}:`)).map((k) => k.split(":")[1])
    );
    const posts = this.postRepo.all().filter((p) => savedIds.has(p.id));
    // paginate is generic in module scope; reuse local sort
    const limit = Math.min(Math.max(params.limit, 1), 50);
    const sorted = [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const decoded = decodeCursor(params.cursor);
    const start = decoded ? sorted.filter((x) => isAfterCursor(x.createdAt, x.id, decoded)) : sorted;
    const items = start.slice(0, limit);
    const last = items[items.length - 1];
    const hasMore = start.length > items.length;
    return { items, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null };
  }
}

export class InMemoryCommentRepository implements CommentRepository {
  private comments: Comment[] = [];
  async listByPost(postId: string, params: CursorParams) {
    return paginate(this.comments.filter((c) => c.postId === postId), params);
  }
  async add(data: { postId: string; author: Author; text: string }): Promise<Comment> {
    const comment: Comment = {
      id: randomUUID(),
      postId: data.postId,
      author: data.author,
      text: data.text,
      likeCount: 0,
      createdAt: new Date(),
    };
    this.comments.push(comment);
    return comment;
  }
  async countByPost(postId: string) {
    return this.comments.filter((c) => c.postId === postId).length;
  }
}

export class InMemoryStoryRepository implements StoryRepository {
  private stories: Story[];
  private seen = new Set<string>();
  constructor(seed = seedStories()) {
    this.stories = seed;
  }
  async listActive(now: Date, viewerId: string | null): Promise<Story[]> {
    return this.stories
      .filter((s) => s.expiresAt > now)
      .map((s) => ({ ...s, seenByMe: viewerId ? this.seen.has(`${viewerId}:${s.id}`) || s.seenByMe : s.seenByMe }))
      .sort((a, b) => Number(a.seenByMe) - Number(b.seenByMe) || b.createdAt.getTime() - a.createdAt.getTime());
  }
  async markSeen(storyId: string, viewerId: string) {
    this.seen.add(`${viewerId}:${storyId}`);
  }
}
