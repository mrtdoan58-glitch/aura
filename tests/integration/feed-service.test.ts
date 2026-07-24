import { describe, it, expect, vi } from "vitest";
import { FeedService } from "@/server/feed/services/feed-service";
import { seedPosts } from "@/server/feed/seed";
import {
  InMemoryPostRepository, InMemoryLikeRepository, InMemorySaveRepository,
  InMemoryCommentRepository, InMemoryStoryRepository, InMemoryCommentLikeRepository, InMemoryCollectionRepository,
  InMemoryHighlightRepository,
} from "@/server/feed/repositories/in-memory";
import type { Author } from "@/server/feed/domain";

const VIEWER = "me";
const AUTHOR: Author = { id: "me", name: "Ben", username: "ben", avatarUrl: "a", verified: false };

function setup(postCount = 24) {
  const posts = new InMemoryPostRepository(seedPosts(postCount));
  const saves = new InMemorySaveRepository(posts);
  const deps = {
    posts,
    likes: new InMemoryLikeRepository(),
    saves,
    comments: new InMemoryCommentRepository(),
    commentLikes: new InMemoryCommentLikeRepository(),
    collections: new InMemoryCollectionRepository(saves),
    highlights: new InMemoryHighlightRepository(),
    stories: new InMemoryStoryRepository(),
  };
  return { service: new FeedService(deps), deps };
}

describe("FeedService — cursor pagination", () => {
  it("paginates the whole feed without duplicates or gaps", async () => {
    const { service } = setup(24);
    const seen = new Set<string>();
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page = await service.getFeed({ cursor, limit: 8 }, VIEWER);
      page.items.forEach((p) => seen.add(p.id));
      cursor = page.nextCursor;
      pages++;
      expect(pages).toBeLessThan(10); // sonsuz döngü koruması
    } while (cursor);
    expect(seen.size).toBe(24);
    expect(pages).toBe(3);
  });

  it("returns items in descending time order", async () => {
    const { service } = setup(10);
    const page = await service.getFeed({ limit: 10 }, null);
    const times = page.items.map((p) => new Date(p.createdAt).getTime());
    const sorted = [...times].sort((a, b) => b - a);
    expect(times).toEqual(sorted);
  });

  it("clamps limit to the allowed maximum", async () => {
    const { service } = setup(40);
    const page = await service.getFeed({ limit: 999 }, null);
    expect(page.items.length).toBeLessThanOrEqual(30);
  });
});

describe("FeedService — read cache (shared base list, per-viewer enrichment)", () => {
  it("caches the base list once but keeps likedByMe per-viewer (no cross-user leak)", async () => {
    const store = new Map<string, unknown>();
    const cache = {
      get: async <T>(k: string): Promise<T | null> => (store.has(k) ? (store.get(k) as T) : null),
      // Redis JSON serileştirmesini taklit et (Date → string): revive yolunu da test eder.
      set: async (k: string, v: unknown) => { store.set(k, JSON.parse(JSON.stringify(v))); },
    };
    const posts = new InMemoryPostRepository(seedPosts(5));
    const saves = new InMemorySaveRepository(posts);
    const spy = vi.spyOn(posts, "listFeed");
    const service = new FeedService({
      posts,
      likes: new InMemoryLikeRepository(),
      saves,
      comments: new InMemoryCommentRepository(),
      commentLikes: new InMemoryCommentLikeRepository(),
      collections: new InMemoryCollectionRepository(saves),
      highlights: new InMemoryHighlightRepository(),
      stories: new InMemoryStoryRepository(),
      readCache: cache,
    });

    const first = (await service.getFeed({ limit: 5 }, "alice")).items[0];
    await service.setLike(first.id, "alice", true);

    const aliceView = (await service.getFeed({ limit: 5 }, "alice")).items.find((p) => p.id === first.id)!;
    const bobView = (await service.getFeed({ limit: 5 }, "bob")).items.find((p) => p.id === first.id)!;

    expect(aliceView.likedByMe).toBe(true); // kendi beğenisi
    expect(bobView.likedByMe).toBe(false); // paylaşılan temel liste ama kişisel enrich → sızıntı yok
    expect(aliceView.createdAt instanceof Date).toBe(true); // revive çalıştı
    expect(spy).toHaveBeenCalledTimes(1); // temel liste DB'den yalnızca bir kez çekildi
  });
});

describe("FeedService — collections", () => {
  it("filters saved posts by collection and keeps 'all' complete", async () => {
    const { service } = setup(4);
    const feed = (await service.getFeed({ limit: 4 }, VIEWER)).items;
    await service.setSave(feed[0].id, VIEWER, true);
    await service.setSave(feed[1].id, VIEWER, true);

    const col = await service.createCollection(VIEWER, "Seyahat");
    await service.setPostCollection(VIEWER, feed[0].id, col.id);

    const all = await service.getSaved({ limit: 10 }, VIEWER);
    const inCol = await service.getSaved({ limit: 10, collectionId: col.id }, VIEWER);
    expect(all.items.map((p) => p.id).sort()).toEqual([feed[0].id, feed[1].id].sort());
    expect(inCol.items.map((p) => p.id)).toEqual([feed[0].id]);

    const list = await service.listCollections(VIEWER);
    expect(list).toHaveLength(1);
    expect(list[0].postCount).toBe(1);
    expect(list[0].coverUrl).toBe(feed[0].media[0].url);
  });

  it("rejects duplicate names, empty names and foreign collections", async () => {
    const { service } = setup(2);
    const col = await service.createCollection(VIEWER, "Sanat");
    await expect(service.createCollection(VIEWER, "Sanat")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(service.createCollection(VIEWER, "   ")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    // başka kullanıcının koleksiyonu görünmez/kullanılamaz
    await expect(service.getSaved({ limit: 5, collectionId: col.id }, "someone-else")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.deleteCollection("someone-else", col.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("requires the post to be saved before assigning, and deleting a collection keeps the saves", async () => {
    const { service } = setup(2);
    const post = (await service.getFeed({ limit: 1 }, VIEWER)).items[0];
    const col = await service.createCollection(VIEWER, "Mimari");
    await expect(service.setPostCollection(VIEWER, post.id, col.id)).rejects.toMatchObject({ code: "INVALID_INPUT" });

    await service.setSave(post.id, VIEWER, true);
    await service.setPostCollection(VIEWER, post.id, col.id);
    expect(await service.getPostCollection(VIEWER, post.id)).toBe(col.id);

    await service.deleteCollection(VIEWER, col.id);
    const all = await service.getSaved({ limit: 10 }, VIEWER);
    expect(all.items.map((p) => p.id)).toContain(post.id); // kayıt duruyor
    expect(await service.getPostCollection(VIEWER, post.id)).toBeNull(); // koleksiyonsuz
  });
});

describe("FeedService — explore (popularity + offset paging)", () => {
  it("orders by likeCount descending", async () => {
    const { service } = setup(20);
    const page = await service.getExplore({ limit: 20 }, null);
    const likes = page.items.map((p) => p.likeCount);
    const sorted = [...likes].sort((a, b) => b - a);
    expect(likes).toEqual(sorted);
  });

  it("paginates every post exactly once via offset cursor", async () => {
    const { service } = setup(20);
    const seen = new Set<string>();
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page = await service.getExplore({ cursor, limit: 7 }, VIEWER);
      page.items.forEach((p) => seen.add(p.id));
      cursor = page.nextCursor;
      expect(++pages).toBeLessThan(10);
    } while (cursor);
    expect(seen.size).toBe(20);
  });

  it("reflects viewer like state after a like", async () => {
    const { service } = setup(5);
    const first = (await service.getExplore({ limit: 5 }, VIEWER)).items[0];
    expect(first.likedByMe).toBe(false);
    await service.setLike(first.id, VIEWER, true);
    const after = (await service.getExplore({ limit: 5 }, VIEWER)).items.find((p) => p.id === first.id);
    expect(after?.likedByMe).toBe(true);
  });
});

describe("FeedService — getPostsByTag", () => {
  it("returns only posts carrying the exact tag (case-insensitive), enriched", async () => {
    const { service } = setup(2);
    await service.createPost(AUTHOR, {
      caption: "Etiketli gönderi",
      tags: ["BenzersizEtiket7", "beton"],
      location: null,
      media: [{ type: "image", url: "u", posterUrl: null, width: 100, height: 100, blurDataUrl: null }],
    });
    const res = await service.getPostsByTag("benzersizetiket7", { limit: 10 }, VIEWER);
    expect(res.items.length).toBe(1);
    expect(res.items[0].tags).toContain("BenzersizEtiket7");
    expect(res.items[0]).toHaveProperty("savedByMe");
  });

  it("returns empty for a tag no post has", async () => {
    const { service } = setup(3);
    const res = await service.getPostsByTag("kesinlikleolmayanetiket", { limit: 10 }, null);
    expect(res.items).toHaveLength(0);
  });
});

describe("FeedService — searchPosts", () => {
  async function seedOne() {
    const { service } = setup(2);
    await service.createPost(AUTHOR, {
      caption: "Kuzey ışıkları altında bir gece",
      tags: ["gökyüzü", "seyahat"],
      location: null,
      media: [{ type: "image", url: "u", posterUrl: null, width: 100, height: 100, blurDataUrl: null }],
    });
    return service;
  }

  it("matches by caption substring (case-insensitive)", async () => {
    const service = await seedOne();
    const res = await service.searchPosts("kuzey", VIEWER);
    expect(res.some((p) => p.caption.includes("Kuzey"))).toBe(true);
  });

  it("matches by exact tag (with or without #)", async () => {
    const service = await seedOne();
    expect((await service.searchPosts("seyahat", VIEWER)).length).toBeGreaterThan(0);
    expect((await service.searchPosts("#gökyüzü", VIEWER)).length).toBeGreaterThan(0);
  });

  it("returns empty for a whitespace query", async () => {
    const service = await seedOne();
    expect(await service.searchPosts("   ", VIEWER)).toHaveLength(0);
  });
});

describe("FeedService — like/save (idempotent + counters)", () => {
  it("likes and unlikes, keeping the counter consistent", async () => {
    const { service } = setup(3);
    const first = (await service.getFeed({ limit: 3 }, VIEWER)).items[0];
    const base = first.likeCount;
    const liked = await service.setLike(first.id, VIEWER, true);
    expect(liked.likeCount).toBe(base + 1);
    // idempotent: tekrar like sayacı bir kez artırmalı
    const again = await service.setLike(first.id, VIEWER, true);
    expect(again.likeCount).toBe(base + 1);
    const unliked = await service.setLike(first.id, VIEWER, false);
    expect(unliked.likeCount).toBe(base);
  });

  it("reflects likedByMe/savedByMe in enriched views", async () => {
    const { service } = setup(3);
    const p = (await service.getFeed({ limit: 3 }, VIEWER)).items[0];
    await service.setLike(p.id, VIEWER, true);
    await service.setSave(p.id, VIEWER, true);
    const view = await service.getPost(p.id, VIEWER);
    expect(view.likedByMe).toBe(true);
    expect(view.savedByMe).toBe(true);
  });

  it("save then listSaved returns the post", async () => {
    const { service } = setup(5);
    const p = (await service.getFeed({ limit: 5 }, VIEWER)).items[0];
    await service.setSave(p.id, VIEWER, true);
    const saved = await service.getSaved({ limit: 10 }, VIEWER);
    expect(saved.items.map((x) => x.id)).toContain(p.id);
  });

  it("requires auth for mutations", async () => {
    const { service } = setup(1);
    const p = (await service.getFeed({ limit: 1 }, null)).items[0];
    await expect(service.setLike(p.id, "", true)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("rejects like on missing post", async () => {
    const { service } = setup(1);
    await expect(service.setLike("nope", VIEWER, true)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("FeedService — comments", () => {
  it("adds a comment and increments the post counter", async () => {
    const { service } = setup(2);
    const p = (await service.getFeed({ limit: 2 }, VIEWER)).items[0];
    const before = p.commentCount;
    const c = await service.addComment(p.id, AUTHOR, "Harika kompozisyon");
    expect(c.text).toBe("Harika kompozisyon");
    const fresh = await service.getPost(p.id, VIEWER);
    expect(fresh.commentCount).toBe(before + 1);
    const list = await service.listComments(p.id, { limit: 10 });
    expect(list.items.map((x) => x.id)).toContain(c.id);
  });

  it("rejects empty and too-long comments", async () => {
    const { service } = setup(1);
    const p = (await service.getFeed({ limit: 1 }, VIEWER)).items[0];
    await expect(service.addComment(p.id, AUTHOR, "   ")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(service.addComment(p.id, AUTHOR, "x".repeat(1001))).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("threads replies under a parent; only top-level bumps the post counter", async () => {
    const { service } = setup(1);
    const p = (await service.getFeed({ limit: 1 }, VIEWER)).items[0];
    const before = p.commentCount;
    const top = await service.addComment(p.id, AUTHOR, "üst yorum");
    const reply = await service.addComment(p.id, AUTHOR, "bir yanıt", top.id);
    expect(reply.parentId).toBe(top.id);

    // Liste yalnızca üst-seviyeyi döner, replyCount ile
    const list = await service.listComments(p.id, { limit: 10 });
    expect(list.items).toHaveLength(1);
    expect(list.items[0].id).toBe(top.id);
    expect(list.items[0].replyCount).toBe(1);

    // Yanıtlar ayrı listelenir
    const replies = await service.listReplies(top.id);
    expect(replies.map((r) => r.id)).toEqual([reply.id]);

    // Post yorum sayacı yalnızca üst-seviye için arttı (+1, yanıt için değil)
    const fresh = await service.getPost(p.id, VIEWER);
    expect(fresh.commentCount).toBe(before + 1);
  });

  it("rejects a reply whose parent belongs to another post", async () => {
    const { service } = setup(2);
    const feed = (await service.getFeed({ limit: 2 }, VIEWER)).items;
    const parent = await service.addComment(feed[0].id, AUTHOR, "başka gönderide");
    await expect(service.addComment(feed[1].id, AUTHOR, "kaçak yanıt", parent.id)).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("likes/unlikes a comment (idempotent) and reflects likedByMe", async () => {
    const { service } = setup(1);
    const p = (await service.getFeed({ limit: 1 }, VIEWER)).items[0];
    const c = await service.addComment(p.id, AUTHOR, "beğenilecek yorum");

    await service.setCommentLike(c.id, VIEWER, true);
    await service.setCommentLike(c.id, VIEWER, true); // idempotent
    let list = await service.listComments(p.id, { limit: 10 }, VIEWER);
    let mine = list.items.find((x) => x.id === c.id)!;
    expect(mine.likeCount).toBe(1);
    expect(mine.likedByMe).toBe(true);

    // Başka bir izleyici için likedByMe=false
    const other = await service.listComments(p.id, { limit: 10 }, "someone-else");
    expect(other.items.find((x) => x.id === c.id)!.likedByMe).toBe(false);

    await service.setCommentLike(c.id, VIEWER, false);
    list = await service.listComments(p.id, { limit: 10 }, VIEWER);
    mine = list.items.find((x) => x.id === c.id)!;
    expect(mine.likeCount).toBe(0);
    expect(mine.likedByMe).toBe(false);
  });
});

describe("FeedService — stories", () => {
  it("returns active stories with seen flags", async () => {
    const { service } = setup(1);
    const stories = await service.getStories(VIEWER);
    expect(stories.length).toBeGreaterThan(0);
    const first = stories[0];
    await service.markStorySeen(first.id, VIEWER);
    const after = await service.getStories(VIEWER);
    expect(after.find((s) => s.id === first.id)?.seenByMe).toBe(true);
  });

  it("creates a story that appears in the active list with a ~24h expiry", async () => {
    const { service } = setup(1);
    const before = Date.now();
    const story = await service.createStory(AUTHOR, { mediaUrl: "https://x.test/s.jpg", type: "image" });
    expect(story.media.url).toBe("https://x.test/s.jpg");
    expect(story.seenByMe).toBe(false);
    const ttl = story.expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(ttl).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
    const active = await service.getStories(null);
    expect(active.map((s) => s.id)).toContain(story.id);
  });

  it("rejects a story with no media url", async () => {
    const { service } = setup(1);
    await expect(service.createStory(AUTHOR, { mediaUrl: "", type: "image" })).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("rate-limits story spam beyond the limit", async () => {
    const posts = new InMemoryPostRepository(seedPosts(1));
    const saves = new InMemorySaveRepository(posts);
    const { InMemoryRateLimiter } = await import("@/server/rate-limit/rate-limiter");
    const deps = {
      posts,
      likes: new InMemoryLikeRepository(),
      saves,
      comments: new InMemoryCommentRepository(),
      commentLikes: new InMemoryCommentLikeRepository(),
      collections: new InMemoryCollectionRepository(saves),
      highlights: new InMemoryHighlightRepository(),
      stories: new InMemoryStoryRepository(),
      storyRateLimiter: new InMemoryRateLimiter(2, 60_000),
    };
    const svc = new FeedService(deps);
    await svc.createStory(AUTHOR, { mediaUrl: "https://x.test/1.jpg", type: "image" });
    await svc.createStory(AUTHOR, { mediaUrl: "https://x.test/2.jpg", type: "image" });
    await expect(svc.createStory(AUTHOR, { mediaUrl: "https://x.test/3.jpg", type: "image" })).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });
});

describe("FeedService — negative & edge cases", () => {
  it("treats a tampered/invalid cursor as the beginning (no crash)", async () => {
    const { service } = setup(10);
    const page = await service.getFeed({ cursor: "!!!garbage!!!", limit: 5 }, null);
    expect(page.items.length).toBe(5);
  });

  it("save is idempotent (double save keeps one entry)", async () => {
    const { service } = setup(3);
    const p = (await service.getFeed({ limit: 3 }, VIEWER)).items[0];
    await service.setSave(p.id, VIEWER, true);
    await service.setSave(p.id, VIEWER, true);
    const saved = await service.getSaved({ limit: 10 }, VIEWER);
    expect(saved.items.filter((x) => x.id === p.id).length).toBe(1);
  });

  it("unlike below zero cannot happen (counter floored)", async () => {
    const { service } = setup(2);
    const p = (await service.getFeed({ limit: 2 }, VIEWER)).items[0];
    const res = await service.setLike(p.id, VIEWER, false); // hiç beğenilmemişken kaldır
    expect(res.likeCount).toBeGreaterThanOrEqual(0);
  });

  it("empty feed yields no items and null cursor", async () => {
    const { service } = setup(0);
    const page = await service.getFeed({ limit: 8 }, null);
    expect(page.items).toHaveLength(0);
    expect(page.nextCursor).toBeNull();
  });
});

describe("FeedService — createPost", () => {
  const VALID_MEDIA = [{ type: "image" as const, url: "https://x.test/a.jpg", posterUrl: null, width: 1080, height: 1350, blurDataUrl: null }];

  it("creates a post and it appears at the top of the feed", async () => {
    const { service } = setup(3);
    const post = await service.createPost(AUTHOR, { caption: "Yeni gönderi", tags: ["a", "b"], location: "İstanbul", media: VALID_MEDIA });
    expect(post.caption).toBe("Yeni gönderi");
    expect(post.tags).toEqual(["a", "b"]);
    expect(post.media).toHaveLength(1);
    expect(post.likeCount).toBe(0);
    const page = await service.getFeed({ limit: 1 }, null);
    expect(page.items[0].id).toBe(post.id);
  });

  it("trims caption and rejects empty/too-long captions", async () => {
    const { service } = setup(1);
    const post = await service.createPost(AUTHOR, { caption: "  merhaba  ", tags: [], location: null, media: VALID_MEDIA });
    expect(post.caption).toBe("merhaba");
    await expect(
      service.createPost(AUTHOR, { caption: "   ", tags: [], location: null, media: VALID_MEDIA })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(
      service.createPost(AUTHOR, { caption: "x".repeat(2201), tags: [], location: null, media: VALID_MEDIA })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("rejects a post with no media", async () => {
    const { service } = setup(1);
    await expect(
      service.createPost(AUTHOR, { caption: "resimsiz", tags: [], location: null, media: [] })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("rejects more than 10 media items", async () => {
    const { service } = setup(1);
    const tooMany = Array.from({ length: 11 }, () => VALID_MEDIA[0]);
    await expect(
      service.createPost(AUTHOR, { caption: "çok medya", tags: [], location: null, media: tooMany })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("rejects media with invalid dimensions", async () => {
    const { service } = setup(1);
    const bad = [{ ...VALID_MEDIA[0], width: 0 }];
    await expect(
      service.createPost(AUTHOR, { caption: "bozuk boyut", tags: [], location: null, media: bad })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});

describe("FeedService — post rate limiting", () => {
  it("blocks post spam beyond the limit", async () => {
    const posts = new InMemoryPostRepository(seedPosts(1));
    const saves = new InMemorySaveRepository(posts);
    const { InMemoryRateLimiter } = await import("@/server/rate-limit/rate-limiter");
    const deps = {
      posts,
      likes: new InMemoryLikeRepository(),
      saves,
      comments: new InMemoryCommentRepository(),
      commentLikes: new InMemoryCommentLikeRepository(),
      collections: new InMemoryCollectionRepository(saves),
      highlights: new InMemoryHighlightRepository(),
      stories: new InMemoryStoryRepository(),
      postRateLimiter: new InMemoryRateLimiter(2, 60_000),
    };
    const svc = new FeedService(deps);
    const media = [{ type: "image" as const, url: "https://x.test/a.jpg", posterUrl: null, width: 1080, height: 1350, blurDataUrl: null }];
    await svc.createPost(AUTHOR, { caption: "1", tags: [], location: null, media });
    await svc.createPost(AUTHOR, { caption: "2", tags: [], location: null, media });
    await expect(
      svc.createPost(AUTHOR, { caption: "3", tags: [], location: null, media })
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});

describe("FeedService — comment rate limiting", () => {
  it("blocks comment spam beyond the limit", async () => {
    const posts = new InMemoryPostRepository(seedPosts(1));
    const saves = new InMemorySaveRepository(posts);
    const { InMemoryRateLimiter } = await import("@/server/rate-limit/rate-limiter");
    const deps = {
      posts,
      likes: new InMemoryLikeRepository(),
      saves,
      comments: new InMemoryCommentRepository(),
      commentLikes: new InMemoryCommentLikeRepository(),
      collections: new InMemoryCollectionRepository(saves),
      highlights: new InMemoryHighlightRepository(),
      stories: new InMemoryStoryRepository(),
      commentRateLimiter: new InMemoryRateLimiter(3, 60_000),
    };
    const svc = new FeedService(deps);
    const p = (await svc.getFeed({ limit: 1 }, VIEWER)).items[0];
    await svc.addComment(p.id, AUTHOR, "1");
    await svc.addComment(p.id, AUTHOR, "2");
    await svc.addComment(p.id, AUTHOR, "3");
    await expect(svc.addComment(p.id, AUTHOR, "4")).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});

describe("FeedService — hikaye vurguları", () => {
  const OTHER: Author = { id: "other", name: "Öteki", username: "oteki", avatarUrl: "b", verified: false };

  it("vurgu hikayelerin medyasını kopyalar: hikayenin süresi dolsa da öğeler kalır", async () => {
    const { service, deps } = setup(2);
    const s1 = await service.createStory(AUTHOR, { mediaUrl: "https://cdn/1.jpg", type: "image" });
    const s2 = await service.createStory(AUTHOR, { mediaUrl: "https://cdn/2.jpg", type: "image" });

    const h = await service.createHighlight(VIEWER, "  Seyahat  ", [s1.id, s2.id, s1.id]); // tekrar elenir
    expect(h.title).toBe("Seyahat");
    expect(h.itemCount).toBe(2);
    expect(h.coverUrl).toBe("https://cdn/1.jpg");

    // 25 saat sonra hikayeler aktif listede yok, ama vurgu öğeleri duruyor
    const later = new Date(Date.now() + 25 * 60 * 60 * 1000);
    expect(await deps.stories.listActive(later, VIEWER)).toHaveLength(0);
    const detail = await service.getHighlight(h.id);
    expect(detail.items.map((i) => i.media.url)).toEqual(["https://cdn/1.jpg", "https://cdn/2.jpg"]);
    expect(detail.userId).toBe(VIEWER);
  });

  it("başkasının hikayesi vurguya eklenemez ve başkasının vurgusu silinemez", async () => {
    const { service } = setup(2);
    const mine = await service.createStory(AUTHOR, { mediaUrl: "https://cdn/mine.jpg", type: "image" });
    const theirs = await service.createStory(OTHER, { mediaUrl: "https://cdn/theirs.jpg", type: "image" });

    // yalnızca kendi hikayem alınır
    const h = await service.createHighlight(VIEWER, "Karışık", [mine.id, theirs.id]);
    const detail = await service.getHighlight(h.id);
    expect(detail.items.map((i) => i.media.url)).toEqual(["https://cdn/mine.jpg"]);

    // sadece başkasının hikayesiyle vurgu oluşturulamaz
    await expect(service.createHighlight(VIEWER, "Çalıntı", [theirs.id])).rejects.toThrow(/bulunamadı/i);
    // başkasının vurgusu silinemez
    await expect(service.deleteHighlight(OTHER.id, h.id)).rejects.toThrow(/bulunamadı/i);
    expect(await service.getHighlights(VIEWER)).toHaveLength(1);
  });

  it("boş ad/boş seçim reddedilir; silince vurgu listeden çıkar", async () => {
    const { service } = setup(2);
    const s = await service.createStory(AUTHOR, { mediaUrl: "https://cdn/x.jpg", type: "image" });
    await expect(service.createHighlight(VIEWER, "   ", [s.id])).rejects.toThrow(/boş olamaz/i);
    await expect(service.createHighlight(VIEWER, "Ad", [])).rejects.toThrow(/en az bir hikaye/i);
    await expect(service.createHighlight(VIEWER, "x".repeat(31), [s.id])).rejects.toThrow(/çok uzun/i);

    const h = await service.createHighlight(VIEWER, "Silinecek", [s.id]);
    expect(await service.getHighlights(VIEWER)).toHaveLength(1);
    await service.deleteHighlight(VIEWER, h.id);
    expect(await service.getHighlights(VIEWER)).toHaveLength(0);
    await expect(service.getHighlight(h.id)).rejects.toThrow(/bulunamadı/i);
  });
});
