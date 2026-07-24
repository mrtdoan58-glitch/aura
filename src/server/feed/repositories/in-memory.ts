/**
 * In-memory feed repository implementasyonları — testler ve DB'siz dev için.
 * Prisma implementasyonu ile birebir aynı arayüzleri uygular (LSP).
 */
import { randomUUID } from "node:crypto";
import type {
  Post, Comment, Story, Author, CursorParams, CursorPage, NewPostMedia, MediaType,
  PostRepository, LikeRepository, SaveRepository, CommentRepository, StoryRepository, CommentLikeRepository,
  Collection, CollectionRepository,
  Highlight, HighlightDetail, HighlightRepository,
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
  async listExplore(params: CursorParams): Promise<CursorPage<Post>> {
    const limit = Math.min(Math.max(params.limit, 1), 50);
    const offset = Math.max(0, Number(params.cursor) || 0);
    const sorted = [...this.posts].sort(
      (a, b) =>
        b.likeCount - a.likeCount ||
        b.createdAt.getTime() - a.createdAt.getTime() ||
        (a.id < b.id ? 1 : -1)
    );
    const items = sorted.slice(offset, offset + limit);
    const hasMore = sorted.length > offset + items.length;
    return { items, nextCursor: hasMore ? String(offset + items.length) : null };
  }
  async listByAuthor(authorId: string, params: CursorParams) {
    return paginate(this.posts.filter((p) => p.author.id === authorId), params);
  }
  async listByTag(tag: string, params: CursorParams) {
    const t = tag.trim().toLowerCase();
    return paginate(this.posts.filter((p) => p.tags.some((x) => x.toLowerCase() === t)), params);
  }
  async searchPosts(query: string, limit: number): Promise<Post[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const tag = q.replace(/^#/, "");
    return this.posts
      .filter((p) => p.caption.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase() === tag))
      .sort((a, b) => b.likeCount - a.likeCount || b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, Math.max(1, limit));
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
  /** `${userId}:${postId}` → collectionId */
  private inCollection = new Map<string, string>();

  constructor(private readonly postRepo: InMemoryPostRepository) {
    super();
  }
  async filterSaved(userId: string, postIds: string[]) {
    return this.filter(userId, postIds);
  }
  async setCollection(userId: string, postId: string, collectionId: string | null): Promise<boolean> {
    const k = this.key(userId, postId);
    if (!this.set.has(k)) return false; // yalnızca kaydedilmiş gönderi bir koleksiyona konabilir
    if (collectionId === null) this.inCollection.delete(k);
    else this.inCollection.set(k, collectionId);
    return true;
  }
  async collectionOf(userId: string, postId: string): Promise<string | null> {
    return this.inCollection.get(this.key(userId, postId)) ?? null;
  }
  /** Bir koleksiyonun kayıt sayısı + kapak görseli (en yeni kayıt). */
  collectionStats(userId: string, collectionId: string): { count: number; coverUrl: string | null } {
    const ids = [...this.inCollection.entries()]
      .filter(([k, c]) => c === collectionId && k.startsWith(`${userId}:`))
      .map(([k]) => k.split(":")[1]);
    const posts = this.postRepo.all()
      .filter((p) => ids.includes(p.id))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { count: ids.length, coverUrl: posts[0]?.media[0]?.url ?? null };
  }
  /** Koleksiyon silindiğinde kayıtları koleksiyonsuz bırak (SetNull karşılığı). */
  detachCollection(collectionId: string): void {
    for (const [k, c] of this.inCollection.entries()) if (c === collectionId) this.inCollection.delete(k);
  }
  async listSaved(userId: string, params: CursorParams, collectionId?: string): Promise<CursorPage<Post>> {
    const savedIds = new Set(
      [...this.set]
        .filter((k) => k.startsWith(`${userId}:`))
        .filter((k) => (collectionId ? this.inCollection.get(k) === collectionId : true))
        .map((k) => k.split(":")[1])
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

export class InMemoryCollectionRepository implements CollectionRepository {
  private rows: { id: string; userId: string; name: string; createdAt: Date }[] = [];
  constructor(private readonly saves: InMemorySaveRepository) {}

  async create(userId: string, name: string): Promise<Collection | null> {
    if (this.rows.some((r) => r.userId === userId && r.name === name)) return null;
    const row = { id: randomUUID(), userId, name, createdAt: new Date() };
    this.rows.push(row);
    return { id: row.id, name: row.name, postCount: 0, coverUrl: null, createdAt: row.createdAt };
  }
  async listForUser(userId: string): Promise<Collection[]> {
    return this.rows
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((r) => {
        const s = this.saves.collectionStats(userId, r.id);
        return { id: r.id, name: r.name, postCount: s.count, coverUrl: s.coverUrl, createdAt: r.createdAt };
      });
  }
  async delete(userId: string, collectionId: string): Promise<void> {
    this.rows = this.rows.filter((r) => !(r.id === collectionId && r.userId === userId));
    this.saves.detachCollection(collectionId);
  }
  async ownedBy(collectionId: string, userId: string): Promise<boolean> {
    return this.rows.some((r) => r.id === collectionId && r.userId === userId);
  }
}

export class InMemoryHighlightRepository implements HighlightRepository {
  private rows: (HighlightDetail & { userId: string })[] = [];

  private summary(h: HighlightDetail): Highlight {
    return {
      id: h.id,
      title: h.title,
      coverUrl: h.items[0]?.media.url ?? null,
      itemCount: h.items.length,
      createdAt: h.createdAt,
    };
  }
  async listForUser(userId: string): Promise<Highlight[]> {
    return this.rows
      .filter((h) => h.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((h) => this.summary(h));
  }
  async get(highlightId: string): Promise<HighlightDetail | null> {
    return this.rows.find((h) => h.id === highlightId) ?? null;
  }
  async create(
    userId: string,
    title: string,
    items: { storyId: string | null; mediaUrl: string; type: MediaType }[]
  ): Promise<Highlight> {
    const now = new Date();
    const row: HighlightDetail & { userId: string } = {
      id: randomUUID(),
      userId,
      title,
      coverUrl: items[0]?.mediaUrl ?? null,
      itemCount: items.length,
      createdAt: now,
      items: items.map((it, i) => ({
        id: randomUUID(),
        storyId: it.storyId,
        media: { id: randomUUID(), type: it.type, url: it.mediaUrl, posterUrl: null, width: 1080, height: 1350, blurDataUrl: null, order: i },
        createdAt: now,
      })),
    };
    this.rows.push(row);
    return this.summary(row);
  }
  async delete(userId: string, highlightId: string): Promise<void> {
    this.rows = this.rows.filter((h) => !(h.id === highlightId && h.userId === userId));
  }
}

export class InMemoryCommentRepository implements CommentRepository {
  private comments: Comment[] = [];
  private replyCount(id: string) {
    return this.comments.filter((c) => c.parentId === id).length;
  }
  async listByPost(postId: string, params: CursorParams) {
    const top = this.comments.filter((c) => c.postId === postId && c.parentId === null);
    const page = paginate(top, params);
    return { ...page, items: page.items.map((c) => ({ ...c, replyCount: this.replyCount(c.id) })) };
  }
  async listReplies(parentId: string, limit: number): Promise<Comment[]> {
    return this.comments
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, Math.max(1, limit));
  }
  async add(data: { postId: string; author: Author; text: string; parentId?: string | null }): Promise<Comment> {
    const comment: Comment = {
      id: randomUUID(),
      postId: data.postId,
      parentId: data.parentId ?? null,
      author: data.author,
      text: data.text,
      likeCount: 0,
      replyCount: 0,
      likedByMe: false,
      createdAt: new Date(),
    };
    this.comments.push(comment);
    return comment;
  }
  async countByPost(postId: string) {
    return this.comments.filter((c) => c.postId === postId && c.parentId === null).length;
  }
  async postIdOf(commentId: string): Promise<string | null> {
    return this.comments.find((c) => c.id === commentId)?.postId ?? null;
  }
  async incrementLikeCount(commentId: string, delta: number) {
    const c = this.comments.find((x) => x.id === commentId);
    if (c) c.likeCount = Math.max(0, c.likeCount + delta);
  }
}

export class InMemoryCommentLikeRepository extends RelationRepo implements CommentLikeRepository {
  async filterLiked(userId: string, commentIds: string[]) {
    return this.filter(userId, commentIds);
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
  async listByAuthor(authorId: string, limit: number): Promise<Story[]> {
    return this.stories
      .filter((s) => s.author.id === authorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  async markSeen(storyId: string, viewerId: string) {
    this.seen.add(`${viewerId}:${storyId}`);
  }
  async create(data: { author: Author; mediaUrl: string; type: MediaType; expiresAt: Date }): Promise<Story> {
    const id = randomUUID();
    const story: Story = {
      id,
      author: data.author,
      media: { id, type: data.type, url: data.mediaUrl, posterUrl: null, width: 1080, height: 1350, blurDataUrl: null, order: 0 },
      createdAt: new Date(),
      expiresAt: data.expiresAt,
      seenByMe: false,
    };
    this.stories.unshift(story);
    return story;
  }
}
