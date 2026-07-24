/**
 * FeedService — feed/post/etkileşim iş kuralları.
 * Bağımlılıklar arayüzle enjekte edilir; Prisma olmadan test edilebilir.
 * Beğeni/kaydet toggle'ları idempotent (çift tıklama güvenli) ve sayaçları tutarlı tutar.
 */
import type {
  PostRepository, LikeRepository, SaveRepository, CommentRepository, StoryRepository, CommentLikeRepository,
  CollectionRepository, Collection,
  HighlightRepository, Highlight, HighlightDetail,
  CursorPage, PostView, Post, Comment, Story, Author, NewPostMedia, MediaType,
} from "@/server/feed/domain";
import type { RateLimiter } from "@/server/rate-limit/rate-limiter";

/**
 * Opsiyonel okuma-cache (ör. Upstash). Paylaşılan temel gönderi listesini önbelleğe
 * alır; kişiselleştirme (likedByMe/savedByMe) ASLA cache'lenmez → çapraz-kullanıcı sızıntısı yok.
 */
export interface ReadCachePort {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}

export interface FeedDeps {
  posts: PostRepository;
  likes: LikeRepository;
  saves: SaveRepository;
  comments: CommentRepository;
  commentLikes: CommentLikeRepository;
  collections: CollectionRepository;
  highlights: HighlightRepository;
  stories: StoryRepository;
  commentRateLimiter?: RateLimiter;
  postRateLimiter?: RateLimiter;
  storyRateLimiter?: RateLimiter;
  readCache?: ReadCachePort;
  now?: () => Date;
}

const BASE_LIST_TTL = 15; // sn — paylaşılan temel liste; sayaçlar en fazla bu kadar bayat

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 30;
const MAX_COMMENT_LEN = 1000;
const MAX_CAPTION_LEN = 2200;
const MAX_MEDIA_COUNT = 10;
const MAX_TAGS_COUNT = 30;
const STORY_TTL_MS = 24 * 60 * 60 * 1000; // hikaye 24 saat sonra kaybolur
const MAX_HIGHLIGHT_TITLE_LEN = 30;
const MAX_HIGHLIGHT_ITEMS = 30;
const STORY_ARCHIVE_LIMIT = 60;

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

  /**
   * Paylaşılan (viewer'dan bağımsız) temel liste sorgusunu kısa TTL ile cache'ler.
   * DB'nin ağır olan join'li list sorgusunu çoğu istekten kaldırır; kişiselleştirme
   * çağıran tarafta enrich() ile taze kalır. Cache yoksa doğrudan fetch (no-op).
   */
  private async cachedList(key: string, fetcher: () => Promise<CursorPage<Post>>): Promise<CursorPage<Post>> {
    const cache = this.deps.readCache;
    if (cache) {
      const raw = await cache.get<CursorPage<Post>>(key);
      if (raw) {
        // JSON round-trip'te Date string'e döner — Post tipini korumak için canlandır.
        return { items: raw.items.map((p) => ({ ...p, createdAt: new Date(p.createdAt) })), nextCursor: raw.nextCursor };
      }
    }
    const page = await fetcher();
    if (cache) await cache.set(key, page, BASE_LIST_TTL);
    return page;
  }

  async getFeed(
    params: { cursor?: string | null; limit?: number },
    viewerId: string | null
  ): Promise<CursorPage<PostView>> {
    const limit = clampLimit(params.limit);
    const page = await this.cachedList(
      `base:feed:${params.cursor ?? "0"}:${limit}`,
      () => this.deps.posts.listFeed({ cursor: params.cursor, limit })
    );
    return { items: await this.enrich(page.items, viewerId), nextCursor: page.nextCursor };
  }

  /** Keşfet ızgarası — popülerliğe göre sıralı, offset sayfalamalı (bkz. repo). */
  async getExplore(
    params: { cursor?: string | null; limit?: number },
    viewerId: string | null
  ): Promise<CursorPage<PostView>> {
    const limit = clampLimit(params.limit);
    const page = await this.cachedList(
      `base:explore:${params.cursor ?? "0"}:${limit}`,
      () => this.deps.posts.listExplore({ cursor: params.cursor, limit })
    );
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
    params: { cursor?: string | null; limit?: number; collectionId?: string },
    viewerId: string
  ): Promise<CursorPage<PostView>> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    if (params.collectionId && !(await this.deps.collections.ownedBy(params.collectionId, viewerId))) {
      throw new FeedError("NOT_FOUND", "Koleksiyon bulunamadı.");
    }
    const page = await this.deps.saves.listSaved(
      viewerId,
      { cursor: params.cursor, limit: clampLimit(params.limit) },
      params.collectionId
    );
    return { items: await this.enrich(page.items, viewerId), nextCursor: page.nextCursor };
  }

  /* --------------------------- Koleksiyonlar --------------------------- */
  async listCollections(viewerId: string): Promise<Collection[]> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    return this.deps.collections.listForUser(viewerId);
  }

  async createCollection(viewerId: string, name: string): Promise<Collection> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    const trimmed = name.trim();
    if (!trimmed) throw new FeedError("INVALID_INPUT", "Koleksiyon adı boş olamaz.");
    if (trimmed.length > 40) throw new FeedError("INVALID_INPUT", "Koleksiyon adı çok uzun.");
    const created = await this.deps.collections.create(viewerId, trimmed);
    if (!created) throw new FeedError("INVALID_INPUT", "Bu isimde bir koleksiyon zaten var.");
    return created;
  }

  async deleteCollection(viewerId: string, collectionId: string): Promise<void> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    if (!(await this.deps.collections.ownedBy(collectionId, viewerId)))
      throw new FeedError("NOT_FOUND", "Koleksiyon bulunamadı.");
    await this.deps.collections.delete(viewerId, collectionId);
  }

  /** Kaydedilmiş bir gönderiyi koleksiyona taşı (null = koleksiyondan çıkar). */
  async setPostCollection(viewerId: string, postId: string, collectionId: string | null): Promise<void> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    if (collectionId && !(await this.deps.collections.ownedBy(collectionId, viewerId)))
      throw new FeedError("NOT_FOUND", "Koleksiyon bulunamadı.");
    const ok = await this.deps.saves.setCollection(viewerId, postId, collectionId);
    if (!ok) throw new FeedError("INVALID_INPUT", "Önce gönderiyi kaydetmelisin.");
  }

  /** Bir gönderinin (viewer için) hangi koleksiyonda olduğu. */
  async getPostCollection(viewerId: string, postId: string): Promise<string | null> {
    if (!viewerId) return null;
    return this.deps.saves.collectionOf(viewerId, postId);
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
  /** Yorum grubuna kullanıcının beğeni durumunu ekler (toplu, N+1 yok). */
  private async enrichComments(comments: Comment[], viewerId: string | null): Promise<Comment[]> {
    if (!viewerId || comments.length === 0) return comments.map((c) => ({ ...c, likedByMe: false }));
    const liked = await this.deps.commentLikes.filterLiked(viewerId, comments.map((c) => c.id));
    return comments.map((c) => ({ ...c, likedByMe: liked.has(c.id) }));
  }

  async listComments(
    postId: string,
    params: { cursor?: string | null; limit?: number },
    viewerId: string | null = null
  ): Promise<CursorPage<Comment>> {
    const page = await this.deps.comments.listByPost(postId, { cursor: params.cursor, limit: clampLimit(params.limit) });
    return { ...page, items: await this.enrichComments(page.items, viewerId) };
  }

  /** Bir yorumun yanıtları (eskiden yeniye). */
  async listReplies(parentId: string, viewerId: string | null = null, limit = 20): Promise<Comment[]> {
    const replies = await this.deps.comments.listReplies(parentId, limit);
    return this.enrichComments(replies, viewerId);
  }

  async setCommentLike(commentId: string, viewerId: string, liked: boolean): Promise<{ liked: boolean }> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    if (liked) {
      const added = await this.deps.commentLikes.add(viewerId, commentId);
      if (added) await this.deps.comments.incrementLikeCount(commentId, 1);
    } else {
      const removed = await this.deps.commentLikes.remove(viewerId, commentId);
      if (removed) await this.deps.comments.incrementLikeCount(commentId, -1);
    }
    return { liked };
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

  /* --------------------------- Hikaye vurguları --------------------------- */

  /** Kullanıcının kendi hikaye arşivi (süresi dolmuşlar dahil) — vurgu oluştururken seçilir. */
  async getStoryArchive(viewerId: string): Promise<Story[]> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    return this.deps.stories.listByAuthor(viewerId, STORY_ARCHIVE_LIMIT);
  }

  /** Bir profilin vurguları (herkese açık). */
  async getHighlights(userId: string): Promise<Highlight[]> {
    return this.deps.highlights.listForUser(userId);
  }

  /** Vurgu detayı (öğeleriyle) — herkese açık. */
  async getHighlight(highlightId: string): Promise<HighlightDetail> {
    const h = await this.deps.highlights.get(highlightId);
    if (!h) throw new FeedError("NOT_FOUND", "Vurgu bulunamadı.");
    return h;
  }

  /**
   * Seçilen hikayelerden vurgu oluşturur. Hikayelerin medyası kopyalanır: hikaye
   * 24 saat sonra süresi dolsa da vurgu kalıcıdır. Sahiplik, kullanıcının kendi
   * arşiviyle kesişim alınarak zorlanır — başkasının hikayesi sessizce elenmez,
   * hiç eşleşme kalmazsa hata verilir.
   */
  async createHighlight(viewerId: string, title: string, storyIds: string[]): Promise<Highlight> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    const trimmed = title.trim();
    if (!trimmed) throw new FeedError("INVALID_INPUT", "Vurgu adı boş olamaz.");
    if (trimmed.length > MAX_HIGHLIGHT_TITLE_LEN) throw new FeedError("INVALID_INPUT", "Vurgu adı çok uzun.");
    const unique = [...new Set(storyIds)];
    if (unique.length === 0) throw new FeedError("INVALID_INPUT", "En az bir hikaye seçmelisin.");
    if (unique.length > MAX_HIGHLIGHT_ITEMS) throw new FeedError("INVALID_INPUT", "Bir vurguya en fazla 30 hikaye eklenebilir.");

    const own = await this.deps.stories.listByAuthor(viewerId, STORY_ARCHIVE_LIMIT);
    const byId = new Map(own.map((s) => [s.id, s]));
    const items = unique
      .map((id) => byId.get(id))
      .filter((s): s is Story => !!s)
      .map((s) => ({ storyId: s.id, mediaUrl: s.media.url, type: s.media.type }));
    if (items.length === 0) throw new FeedError("NOT_FOUND", "Seçilen hikayeler bulunamadı.");

    return this.deps.highlights.create(viewerId, trimmed, items);
  }

  async deleteHighlight(viewerId: string, highlightId: string): Promise<void> {
    if (!viewerId) throw new FeedError("UNAUTHENTICATED", "Giriş gerekli.");
    const h = await this.deps.highlights.get(highlightId);
    if (!h || h.userId !== viewerId) throw new FeedError("NOT_FOUND", "Vurgu bulunamadı.");
    await this.deps.highlights.delete(viewerId, highlightId);
  }
}
