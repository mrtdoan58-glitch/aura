import { describe, it, expect } from "vitest";
import { NotificationService } from "@/server/notifications/services/notification-service";
import { InMemoryNotificationRepository } from "@/server/notifications/repositories/in-memory";
import type { FollowLookup } from "@/server/notifications/domain";
import type { Author } from "@/server/feed/domain";

const ALICE: Author = { id: "alice", name: "Alice", username: "alice", avatarUrl: "a", verified: false };
const BOB: Author = { id: "bob", name: "Bob", username: "bob", avatarUrl: "b", verified: false };

function setup(followState = false) {
  const follows: FollowLookup = { exists: async () => followState };
  const service = new NotificationService({ repo: new InMemoryNotificationRepository(), follows });
  return { service };
}

describe("NotificationService — notify", () => {
  it("creates a notification for the recipient", async () => {
    const { service } = setup();
    await service.notify({ recipientId: BOB.id, actor: ALICE, type: "FOLLOW" });
    const res = await service.list(BOB.id, {});
    expect(res.items).toHaveLength(1);
    expect(res.items[0].actor.username).toBe("alice");
    expect(res.items[0].type).toBe("FOLLOW");
    expect(res.unreadCount).toBe(1);
  });

  it("never notifies yourself", async () => {
    const { service } = setup();
    await service.notify({ recipientId: ALICE.id, actor: ALICE, type: "LIKE", postId: "p1" });
    const res = await service.list(ALICE.id, {});
    expect(res.items).toHaveLength(0);
  });

  it("only the recipient sees the notification", async () => {
    const { service } = setup();
    await service.notify({ recipientId: BOB.id, actor: ALICE, type: "LIKE", postId: "p1", postImageUrl: "img" });
    expect((await service.list(BOB.id, {})).items).toHaveLength(1);
    expect((await service.list(ALICE.id, {})).items).toHaveLength(0);
  });
});

describe("NotificationService — list", () => {
  it("includes viewerFollowsActor only for FOLLOW rows", async () => {
    const { service } = setup(true); // viewer follows everyone
    await service.notify({ recipientId: BOB.id, actor: ALICE, type: "FOLLOW" });
    await service.notify({ recipientId: BOB.id, actor: ALICE, type: "LIKE", postId: "p1" });
    const res = await service.list(BOB.id, {});
    const follow = res.items.find((n) => n.type === "FOLLOW");
    const like = res.items.find((n) => n.type === "LIKE");
    expect(follow?.viewerFollowsActor).toBe(true);
    expect(like?.viewerFollowsActor).toBe(false);
  });

  it("returns newest first", async () => {
    const { service } = setup();
    await service.notify({ recipientId: BOB.id, actor: ALICE, type: "FOLLOW" });
    await new Promise((r) => setTimeout(r, 2));
    await service.notify({ recipientId: BOB.id, actor: ALICE, type: "LIKE", postId: "p2" });
    const res = await service.list(BOB.id, {});
    expect(res.items[0].type).toBe("LIKE");
    expect(res.items[1].type).toBe("FOLLOW");
  });
});

describe("NotificationService — markAllRead / unreadCount", () => {
  it("marks all read and zeroes the unread count", async () => {
    const { service } = setup();
    await service.notify({ recipientId: BOB.id, actor: ALICE, type: "FOLLOW" });
    await service.notify({ recipientId: BOB.id, actor: ALICE, type: "LIKE", postId: "p1" });
    expect(await service.unreadCount(BOB.id)).toBe(2);
    await service.markAllRead(BOB.id);
    expect(await service.unreadCount(BOB.id)).toBe(0);
    const res = await service.list(BOB.id, {});
    expect(res.items.every((n) => n.read)).toBe(true);
  });
});
