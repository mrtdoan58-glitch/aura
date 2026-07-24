/**
 * In-memory messaging repository — testler ve DB'siz dev için.
 * Prisma implementasyonu ile aynı arayüzleri uygular (LSP).
 */
import { randomUUID } from "node:crypto";
import type {
  ConversationRepository, MessageRepository, ConversationSummary, Message,
} from "@/server/messaging/domain";
import type { CursorParams, CursorPage } from "@/server/feed/domain";
import { encodeCursor, decodeCursor, isAfterCursor } from "@/server/feed/cursor";

interface ConversationRow {
  id: string;
  key: string;
  createdAt: Date;
  lastMessageAt: Date;
}
interface ParticipantRow {
  conversationId: string;
  userId: string;
  lastReadAt: Date;
}

/** İki repo'nun paylaştığı bellek deposu. */
export class InMemoryMessagingStore {
  conversations: ConversationRow[] = [];
  participants: ParticipantRow[] = [];
  messages: Message[] = [];
}

export class InMemoryConversationRepository implements ConversationRepository {
  constructor(private readonly store: InMemoryMessagingStore) {}

  async findIdByKey(key: string): Promise<string | null> {
    return this.store.conversations.find((c) => c.key === key)?.id ?? null;
  }

  async create(key: string, userA: string, userB: string, now: Date): Promise<string> {
    const id = randomUUID();
    this.store.conversations.push({ id, key, createdAt: now, lastMessageAt: now });
    this.store.participants.push({ conversationId: id, userId: userA, lastReadAt: now });
    this.store.participants.push({ conversationId: id, userId: userB, lastReadAt: now });
    return id;
  }

  async listForUser(userId: string): Promise<ConversationSummary[]> {
    const myConvIds = this.store.participants
      .filter((p) => p.userId === userId)
      .map((p) => p.conversationId);
    const rows = this.store.conversations
      .filter((c) => myConvIds.includes(c.id))
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
    return rows.map((c) => {
      const other = this.store.participants.find((p) => p.conversationId === c.id && p.userId !== userId);
      const mine = this.store.participants.find((p) => p.conversationId === c.id && p.userId === userId);
      const msgs = this.store.messages
        .filter((m) => m.conversationId === c.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const last = msgs[0] ?? null;
      const lastRead = mine?.lastReadAt ?? new Date(0);
      const unreadCount = msgs.filter((m) => m.senderId !== userId && m.createdAt > lastRead).length;
      return {
        id: c.id,
        otherUserId: other?.userId ?? "",
        lastMessageAt: c.lastMessageAt,
        lastMessageText: last ? (last.text || (last.imageUrl ? "📷 Fotoğraf" : "")) : null,
        lastMessageSenderId: last?.senderId ?? null,
        unreadCount,
      };
    });
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    return this.store.participants.some((p) => p.conversationId === conversationId && p.userId === userId);
  }

  async otherUserId(conversationId: string, userId: string): Promise<string | null> {
    return (
      this.store.participants.find((p) => p.conversationId === conversationId && p.userId !== userId)?.userId ?? null
    );
  }

  async otherLastReadAt(conversationId: string, userId: string): Promise<Date | null> {
    return (
      this.store.participants.find((p) => p.conversationId === conversationId && p.userId !== userId)?.lastReadAt ?? null
    );
  }

  async touch(conversationId: string, at: Date): Promise<void> {
    const c = this.store.conversations.find((x) => x.id === conversationId);
    if (c) c.lastMessageAt = at;
  }

  async markRead(conversationId: string, userId: string, at: Date): Promise<void> {
    const p = this.store.participants.find((x) => x.conversationId === conversationId && x.userId === userId);
    if (p) p.lastReadAt = at;
  }
}

export class InMemoryMessageRepository implements MessageRepository {
  constructor(private readonly store: InMemoryMessagingStore) {}

  async list(conversationId: string, params: CursorParams): Promise<CursorPage<Message>> {
    const limit = Math.min(Math.max(params.limit, 1), 50);
    const sorted = this.store.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1));
    const decoded = decodeCursor(params.cursor);
    const start = decoded ? sorted.filter((m) => isAfterCursor(m.createdAt, m.id, decoded)) : sorted;
    const items = start.slice(0, limit);
    const last = items[items.length - 1];
    const hasMore = start.length > items.length;
    return { items, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null };
  }

  async create(data: { conversationId: string; senderId: string; text: string; imageUrl?: string | null; now: Date }): Promise<Message> {
    const message: Message = {
      id: randomUUID(),
      conversationId: data.conversationId,
      senderId: data.senderId,
      text: data.text,
      imageUrl: data.imageUrl ?? null,
      createdAt: data.now,
    };
    this.store.messages.push(message);
    return message;
  }
}
