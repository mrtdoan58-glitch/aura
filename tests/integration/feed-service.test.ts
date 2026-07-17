import { describe, it, expect } from "vitest";
import { FeedService } from "@/server/feed/services/feed-service";
import { buildInMemoryFeedDeps } from "@/server/feed/container";
import { seedPosts } from "@/server/feed/seed";
import {
  InMemoryPostRepository, InMemoryLikeRepository, InMemorySaveRepository,
  InMemoryCommentRepository, InMemoryStoryRepository,
} from "@/server/feed/repositories/in-memory";
import type { Author } from "@/server/feed/domain";

const VIEWER = "me";
const AUTHOR: Author = { id: "me", name: "Ben", username: "ben", avatarUrl: "a", verified: false };

function setup(postCount = 24) {
  const posts = new InMemoryPostRepository(seedPosts(postCount));
  const deps = {
    posts,
    likes: new InMemoryLikeRepository(),
    saves: new InMemorySaveRepository(posts),
    comments: new InMemoryCommentRepository(),
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

describe("FeedService — comment rate limiting", () => {
  it("blocks comment spam beyond the limit", async () => {
    const posts = new InMemoryPostRepository(seedPosts(1));
    const { InMemoryRateLimiter } = await import("@/server/rate-limit/rate-limiter");
    const deps = {
      posts,
      likes: new InMemoryLikeRepository(),
      saves: new InMemorySaveRepository(posts),
      comments: new InMemoryCommentRepository(),
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
