import { describe, it, expect } from "vitest";
import { MessagingService } from "@/server/messaging/services/messaging-service";
import {
  InMemoryMessagingStore, InMemoryConversationRepository, InMemoryMessageRepository,
} from "@/server/messaging/repositories/in-memory";
import type { User } from "@/server/auth/domain";

function fakeUser(id: string, username: string): User {
  return {
    id, username, name: username, email: `${username}@t.dev`, passwordHash: "x", role: "USER",
    emailVerified: null, avatarUrl: null, failedLoginCount: 0, lockedUntil: null,
    twoFactorSecret: null, twoFactorEnabled: false, createdAt: new Date(), updatedAt: new Date(),
  };
}

function setup() {
  const ALICE = fakeUser("alice", "alice");
  const BOB = fakeUser("bob", "bob");
  const CARA = fakeUser("cara", "cara");
  const byId = new Map([[ALICE.id, ALICE], [BOB.id, BOB], [CARA.id, CARA]]);
  const byName = new Map([["alice", ALICE], ["bob", BOB], ["cara", CARA]]);
  const store = new InMemoryMessagingStore();
  // Zamanı ilerlet: oluşturma < mesaj < okuma sıralaması net olsun (unread mantığı).
  let t = 1_000_000;
  const service = new MessagingService({
    conversations: new InMemoryConversationRepository(store),
    messages: new InMemoryMessageRepository(store),
    users: {
      getUserById: async (id) => byId.get(id) ?? null,
      getUserByUsername: async (un) => byName.get(un) ?? null,
    },
    now: () => new Date((t += 1000)),
  });
  return { service, ALICE, BOB, CARA };
}

describe("MessagingService — getOrCreateConversation", () => {
  it("is idempotent regardless of participant order", async () => {
    const { service, ALICE, BOB } = setup();
    const a = await service.getOrCreateConversation(ALICE.id, BOB.id);
    const b = await service.getOrCreateConversation(BOB.id, ALICE.id);
    expect(a).toBe(b);
  });

  it("rejects messaging yourself", async () => {
    const { service, ALICE } = setup();
    await expect(service.getOrCreateConversation(ALICE.id, ALICE.id)).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("throws NOT_FOUND for an unknown user", async () => {
    const { service, ALICE } = setup();
    await expect(service.getOrCreateConversation(ALICE.id, "ghost")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("MessagingService — send / list / unread", () => {
  it("shows last message and unread only for the recipient", async () => {
    const { service, ALICE, BOB } = setup();
    const id = await service.getOrCreateConversation(ALICE.id, BOB.id);
    await service.sendMessage(id, ALICE.id, "Merhaba Bob");

    const bobList = await service.listConversations(BOB.id);
    expect(bobList).toHaveLength(1);
    expect(bobList[0].lastMessageText).toBe("Merhaba Bob");
    expect(bobList[0].lastMessageMine).toBe(false);
    expect(bobList[0].unreadCount).toBe(1);
    expect(bobList[0].otherUser.username).toBe("alice");

    const aliceList = await service.listConversations(ALICE.id);
    expect(aliceList[0].lastMessageMine).toBe(true);
    expect(aliceList[0].unreadCount).toBe(0);
  });

  it("exposes the other participant's last-read time (read receipts)", async () => {
    const { service, ALICE, BOB } = setup();
    const id = await service.getOrCreateConversation(ALICE.id, BOB.id);
    const msg = await service.sendMessage(id, ALICE.id, "gördün mü?");
    // Bob henüz açmadı → Alice'in gördüğü otherLastReadAt mesajdan önce
    const before = await service.getThread(id, ALICE.id, {});
    expect(before.otherLastReadAt!.getTime()).toBeLessThan(msg.createdAt.getTime());
    // Bob konuşmayı açar (okundu) → Alice tekrar bakınca mesaj görülmüş sayılır
    await service.getThread(id, BOB.id, {});
    const after = await service.getThread(id, ALICE.id, {});
    expect(after.otherLastReadAt!.getTime()).toBeGreaterThanOrEqual(msg.createdAt.getTime());
  });

  it("opening the thread marks it read", async () => {
    const { service, ALICE, BOB } = setup();
    const id = await service.getOrCreateConversation(ALICE.id, BOB.id);
    await service.sendMessage(id, ALICE.id, "1");
    await service.sendMessage(id, ALICE.id, "2");
    expect((await service.listConversations(BOB.id))[0].unreadCount).toBe(2);

    const thread = await service.getThread(id, BOB.id, {});
    expect(thread.messages.map((m) => m.text)).toEqual(["2", "1"]); // DESC
    expect((await service.listConversations(BOB.id))[0].unreadCount).toBe(0);
  });
});

describe("MessagingService — image messages", () => {
  it("sends an image-only message; list preview shows a photo label", async () => {
    const { service, ALICE, BOB } = setup();
    const id = await service.getOrCreateConversation(ALICE.id, BOB.id);
    const m = await service.sendImageMessage(id, ALICE.id, "https://blob/x.jpg");
    expect(m.imageUrl).toBe("https://blob/x.jpg");
    expect(m.text).toBe("");
    const bobList = await service.listConversations(BOB.id);
    expect(bobList[0].lastMessageText).toBe("📷 Fotoğraf");
    expect(bobList[0].unreadCount).toBe(1);
  });

  it("rejects an image message without a url", async () => {
    const { service, ALICE, BOB } = setup();
    const id = await service.getOrCreateConversation(ALICE.id, BOB.id);
    await expect(service.sendImageMessage(id, ALICE.id, "")).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});

describe("MessagingService — authorization", () => {
  it("blocks non-participants from reading or writing", async () => {
    const { service, ALICE, BOB, CARA } = setup();
    const id = await service.getOrCreateConversation(ALICE.id, BOB.id);
    await expect(service.getThread(id, CARA.id, {})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(service.sendMessage(id, CARA.id, "sızma")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects empty messages", async () => {
    const { service, ALICE, BOB } = setup();
    const id = await service.getOrCreateConversation(ALICE.id, BOB.id);
    await expect(service.sendMessage(id, ALICE.id, "   ")).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});
