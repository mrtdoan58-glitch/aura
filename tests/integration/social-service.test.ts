import { describe, it, expect } from "vitest";
import { SocialService, SocialError } from "@/server/social/services/social-service";
import { InMemoryFollowRepository } from "@/server/social/repositories/in-memory";
import type { User } from "@/server/auth/domain";

function fakeUser(overrides: Partial<User> & { id: string; username: string }): User {
  return {
    email: `${overrides.username}@test.dev`,
    name: overrides.username,
    passwordHash: "x",
    role: "USER",
    emailVerified: null,
    avatarUrl: null,
    failedLoginCount: 0,
    lockedUntil: null,
    twoFactorSecret: null,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function setup() {
  const ALICE = fakeUser({ id: "alice-id", username: "alice", name: "Alice" });
  const BOB = fakeUser({ id: "bob-id", username: "bob", name: "Bob" });
  const users = new Map([
    [ALICE.username, ALICE],
    [BOB.username, BOB],
  ]);
  const postCounts = new Map<string, number>([[ALICE.id, 3]]);
  const service = new SocialService({
    follows: new InMemoryFollowRepository(),
    users: { getUserByUsername: async (username) => users.get(username) ?? null },
    posts: { countPostsByAuthor: async (authorId) => postCounts.get(authorId) ?? 0 },
  });
  return { service, ALICE, BOB };
}

describe("SocialService — getProfile", () => {
  it("returns profile counts and followedByMe=false when unauthenticated", async () => {
    const { service, ALICE } = setup();
    const profile = await service.getProfile("alice", null);
    expect(profile.id).toBe(ALICE.id);
    expect(profile.postCount).toBe(3);
    expect(profile.followerCount).toBe(0);
    expect(profile.followedByMe).toBe(false);
    expect(profile.isMe).toBe(false);
  });

  it("marks isMe when the viewer is the profile owner", async () => {
    const { service, ALICE } = setup();
    const profile = await service.getProfile("alice", ALICE.id);
    expect(profile.isMe).toBe(true);
  });

  it("throws NOT_FOUND for a nonexistent username", async () => {
    const { service } = setup();
    await expect(service.getProfile("nope", null)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("SocialService — setFollow", () => {
  it("follows and unfollows, updating followerCount", async () => {
    const { service, ALICE, BOB } = setup();
    const followed = await service.setFollow(BOB.id, ALICE.id, true);
    expect(followed.following).toBe(true);
    expect(followed.followerCount).toBe(1);

    const profile = await service.getProfile("alice", BOB.id);
    expect(profile.followedByMe).toBe(true);
    expect(profile.followerCount).toBe(1);

    const unfollowed = await service.setFollow(BOB.id, ALICE.id, false);
    expect(unfollowed.following).toBe(false);
    expect(unfollowed.followerCount).toBe(0);
  });

  it("is idempotent (double follow counts once)", async () => {
    const { service, ALICE, BOB } = setup();
    await service.setFollow(BOB.id, ALICE.id, true);
    const again = await service.setFollow(BOB.id, ALICE.id, true);
    expect(again.followerCount).toBe(1);
  });

  it("rejects following yourself", async () => {
    const { service, ALICE } = setup();
    await expect(service.setFollow(ALICE.id, ALICE.id, true)).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("requires authentication", async () => {
    const { service, ALICE } = setup();
    await expect(service.setFollow("", ALICE.id, true)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
});

describe("SocialError", () => {
  it("carries the error code and message", () => {
    const e = new SocialError("NOT_FOUND", "yok");
    expect(e.code).toBe("NOT_FOUND");
    expect(e.message).toBe("yok");
    expect(e.name).toBe("SocialError");
  });
});
