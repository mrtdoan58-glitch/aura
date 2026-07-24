/**
 * FeedService — feed/post/etkileşim iş kuralları.
 * Bağımlılıklar arayüzle enjekte edilir; Prisma olmadan test edilebilir.
 * Beğeni/kaydet toggle'ları idempotent (çift tıklama güvenli) ve sayaçları tutarlı tutar.
 */
import type {
  PostRepository, LikeRepository, SaveRepository, CommentRepository, StoryRepository,
  CursorPage, PostView, Post, Comment, Story, Author, NewPostMedia, MediaType,
} from "@/server/feed/domain";
import type { RateLimiter } from "@/server/rate-limit/rate-limiter";

export interface FeedDeps {
  posts: PostRepository;
  likes: LikeRepository;
  saves: SaveRepository;
  comments: CommentRepository;
  stories: StoryRepository;
  commentRateLimiter?: RateLimiter;
  postRateLimiter?: RateLimiter;
  storyRateLimiter?: RateLimiter;
  now?: () => Date;
}

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 30;
const MAX_COMMENT_LEN = 1000;
const MAX_CAPTION_LEN = 2200;
const MAX_MEDIA_COUNT = 10;
const MAX_TAGS_COUNT = 30;
const STORY_TTL_MS = 24 * 60 * 60 * 1000; // hikaye 24 saat sonra kaybolur

export class FeedError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "INVALID_INPUT" | "UNAUTHENTICATED" | "RATE_LIMITED",
    message: string
  ) {
    super(message);
    this.name = "FeedError";
  }
}

function clampLimit(n: number | undefined): number {
  if (!n || Number.isNaN(n)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(n), 1), MAX_LIMIT);
}

export class FeedService {
  private now: () => Date;
  constructor(private readonly deps: FeedDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  /** Zenginleştirme: bir gönderi grubuna kullanıcının like/save durumunu ekler (toplu, N+1 yok). */
  private async enrich(posts: Post[], viewerId: string | null): Promise<PostView[]> {
    if (!viewerId) return posts.map((p) => ({ ...p, likedByMe: false, savedByMe: false }));
    const ids = posts.map((p) => p.id);
    const [liked, saved] = await Promise.all([
      this.deps.likes.filterLiked(viewerId, ids),
      this.deps.saves.filterSaved(viewerId, ids),
    ]);
    return posts.map((p) => ({ ...p, likedByMe: liked.has(p.id), savedByMe: saved.has(p.id) }));
  }

  async getFeed(
    params: { cursor?: string | null; limit?: number },
    viewerId: string | null
  ): Promise<CursorPage<PostView>> {
    const page = await this.deps.posts.listFeed({ cursor: params.cursor, limit: clampLimit(params.limit) });
    return { items: await this.enrich(page.items, viewerId), nextCursor: page.nextCursor };
  }

  /** Keşfet ızgarası — popülerliğe göre sıralı, offset sayfalamalı (bkz. repo). */
  async getExplore(
    params: { cursor?: string | null; limit?: number },
    viewerId: string | null
  ): Promise<CursorPage<PostView>> {
    const page = await this.deps.posts.listExplore({ cursor: params.cursor, limit: clampLimit(params.limit) });
    return { items: await this.enrich(page.items, viewerId), nextCursor: page.nextCursor };
  }

  /** Arama sonuçları — caption/etiket eşleşen gönderiler, viewer durumu zenginleştirilmiş. */
  async searchPosts(query: string, viewerId: string | null, limit = 18): Promise<PostView[]> {
    const posts = await this.deps.posts.searchPosts(query, clampLimit(limit));
    return this.enrich(posts, viewerId);
  }

  async getPost(id: string, viewerId: string | null): Promise<PostView> {
    const post = await this.deps.posts.findById(id);
    if (!post) throw new FeedError("NOT_FOUND", "Gönderi bulunamadı.");
    const [enriched] = await this.enrich([post], viewerId);
    return enriched;
  }

  /** Bir kullanıcının profil ızgarası (bkz. server/social — takip/profil o modülde). */
  async getUserPosts(
    authorId: string,
    params: { cursor?: string | null; limit?: number },
    viewerId: string | null
  ): Promise<CursorPage<PostView>> {
    const page = await this.deps.posts.listByAuthor(authorId, { cursor: params.cursor, limit: clampLimit(params.limit) });
    return { items: await this.enrich(page.items, viewerId), nextCursor: page.nextCursor };
  }

  async countPostsByAuthor(authorId: string): Promise<number> {
    return this.deps.posts.countByAuthor(authorId);
  }

  /** Bir etikete sahip gönderiler — zaman-sıralı, viewer durumu zenginleştirilmiş. */
  async getPostsByTag(
    tag: string,
    params: { cursor?: string | null; limit?: number },
    viewerId: string | null
  ): Promise<CursorPage<PostView>> {
    const page = await this.deps.posts.listByTag(tag, { cursor: params.cursor, limit: clampLimit(params.limit) });
    return { items: await this.enrich(page.items, viewerId), nextCursor: page.nextCursor };
  }

  async getSaved(
    params: { cursor?: string | null; limit?: number },
    viewerId: string
  ): Promise<CursorPage<PostView>> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    const page = await this.deps.saves.listSaved(viewerId, { cursor: params.cursor, limit: clampLimit(params.limit) });
    return { items: await this.enrich(page.items, viewerId), nextCursor: page.nextCursor };
  }

  /* --------------------------- Beğeni --------------------------- */
  async setLike(postId: string, viewerId: string, liked: boolean): Promise<{ liked: boolean; likeCount: number }> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    const post = await this.deps.posts.findById(postId);
    if (!post) throw new FeedError("NOT_FOUND", "Gönderi bulunamadı.");
    if (liked) {
      const added = await this.deps.likes.add(viewerId, postId);
      if (added) await this.deps.posts.incrementLikeCount(postId, 1);
    } else {
      const removed = await this.deps.likes.remove(viewerId, postId);
      if (removed) await this.deps.posts.incrementLikeCount(postId, -1);
    }
    const fresh = await this.deps.posts.findById(postId);
    return { liked, likeCount: fresh?.likeCount ?? post.likeCount };
  }

  /* --------------------------- Kaydet --------------------------- */
  async setSave(postId: string, viewerId: string, saved: boolean): Promise<{ saved: boolean }> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    const post = await this.deps.posts.findById(postId);
    if (!post) throw new FeedError("NOT_FOUND", "Gönderi bulunamadı.");
    if (saved) await this.deps.saves.add(viewerId, postId);
    else await this.deps.saves.remove(viewerId, postId);
    return { saved };
  }

  /* --------------------------- Yorumlar --------------------------- */
  async listComments(postId: string, params: { cursor?: string | null; limit?: number }): Promise<CursorPage<Comment>> {
    return this.deps.comments.listByPost(postId, { cursor: params.cursor, limit: clampLimit(params.limit) });
  }

  /** Bir yorumun yanıtları (eskiden yeniye). */
  async listReplies(parentId: string, limit = 20): Promise<Comment[]> {
    return this.deps.comments.listReplies(parentId, limit);
  }

  async addComment(postId: string, author: Author, text: string, parentId?: string | null): Promise<Comment> {
    const trimmed = text.trim();
    if (!trimmed) throw new FeedError("INVALID_INPUT", "Yorum boş olamaz.");
    if (trimmed.length > MAX_COMMENT_LEN) throw new FeedError("INVALID_INPUT", "Yorum çok uzun.");
    if (this.deps.commentRateLimiter) {
      const rl = await this.deps.commentRateLimiter.consume(`comment:${author.id}`);
      if (!rl.allowed) throw new FeedError("RATE_LIMITED", "Çok hızlı yorum yapıyorsun. Biraz bekle.");
    }
    const post = await this.deps.posts.findById(postId);
    if (!post) throw new FeedError("NOT_FOUND", "Gönderi bulunamadı.");
    if (parentId) {
      // Yanıt: üst yorum aynı gönderiye ait olmalı (yalnızca tek seviye yanıt).
      const parentPost = await this.deps.comments.postIdOf(parentId);
      if (parentPost !== postId) throw new FeedError("INVALID_INPUT", "Geçersiz yanıt hedefi.");
    }
    const comment = await this.deps.comments.add({ postId, author, text: trimmed, parentId: parentId ?? null });
    // Yalnızca üst-seviye yorumlar gönderi yorum sayacını artırır (yanıtlar değil).
    if (!parentId) await this.deps.posts.incrementCommentCount(postId, 1);
    return comment;
  }

  /* --------------------------- Gönderi oluşturma --------------------------- */
  async createPost(
    author: Author,
    data: { caption: string; tags: string[]; location: string | null; media: NewPostMedia[] }
  ): Promise<Post> {
    const trimmed = data.caption.trim();
    if (!trimmed) throw new FeedError("INVALID_INPUT", "Başlık boş olamaz.");
    if (trimmed.length > MAX_CAPTION_LEN) throw new FeedError("INVALID_INPUT", "Başlık çok uzun.");
    if (data.media.length === 0) throw new FeedError("INVALID_INPUT", "En az bir fotoğraf veya video gerekli.");
    if (data.media.length > MAX_MEDIA_COUNT) throw new FeedError("INVALID_INPUT", "En fazla 10 medya eklenebilir.");
    if (data.tags.length > MAX_TAGS_COUNT) throw new FeedError("INVALID_INPUT", "En fazla 30 etiket eklenebilir.");
    for (const m of data.media) {
      if (!m.url || m.width <= 0 || m.height <= 0) throw new FeedError("INVALID_INPUT", "Geçersiz medya.");
    }
    if (this.deps.postRateLimiter) {
      const rl = await this.deps.postRateLimiter.consume(`post:${author.id}`);
      if (!rl.allowed) throw new FeedError("RATE_LIMITED", "Çok hızlı paylaşım yapıyorsun. Biraz bekle.");
    }
    return this.deps.posts.create({ author, caption: trimmed, tags: data.tags, location: data.location, media: data.media });
  }

  /* --------------------------- Hikayeler --------------------------- */
  async getStories(viewerId: string | null): Promise<Story[]> {
    return this.deps.stories.listActive(this.now(), viewerId);
  }
  async markStorySeen(storyId: string, viewerId: string): Promise<void> {
    if (!viewerId) return;
    await this.deps.stories.markSeen(storyId, viewerId);
  }

  async createStory(author: Author, data: { mediaUrl: string; type: MediaType }): Promise<Story> {
    if (!data.mediaUrl) throw new FeedError("INVALID_INPUT", "Geçersiz medya.");
    if (this.deps.storyRateLimiter) {
      const rl = await this.deps.storyRateLimiter.consume(`story:${author.id}`);
      if (!rl.allowed) throw new FeedError("RATE_LIMITED", "Çok hızlı hikaye paylaşıyorsun. Biraz bekle.");
    }
    const expiresAt = new Date(this.now().getTime() + STORY_TTL_MS);
    return this.deps.stories.create({ author, mediaUrl: data.mediaUrl, type: data.type, expiresAt });
  }
}
