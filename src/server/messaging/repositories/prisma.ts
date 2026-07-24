/**
 * Prisma messaging repository (üretim). `prisma generate` gerektirir; tsconfig `exclude`.
 * In-memory ile aynı arayüzleri/semantiği uygular (LSP). Okunmamış sayısı, kullanıcının
 * lastReadAt'inden sonra karşı taraftan gelen mesajlarla hesaplanır.
 */
import { prisma } from "@/server/db/prisma";
import { decodeCursor, encodeCursor } from "@/server/feed/cursor";
import type {
  ConversationRepository, MessageRepository, ConversationSummary, Message,
} from "@/server/messaging/domain";
import type { CursorParams, CursorPage } from "@/server/feed/domain";

function isUniqueConstraintError(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === "P2002";
}

export class PrismaConversationRepository implements ConversationRepository {
  async findIdByKey(key: string): Promise<string | null> {
    const row = await prisma.conversation.findUnique({ where: { key }, select: { id: true } });
    return row?.id ?? null;
  }

  async create(key: string, userA: string, userB: string, now: Date): Promise<string> {
    try {
      const c = await prisma.conversation.create({
        data: {
          key,
          createdAt: now,
          lastMessageAt: now,
          participants: {
            create: [
              { userId: userA, lastReadAt: now },
              { userId: userB, lastReadAt: now },
            ],
          },
        },
        select: { id: true },
      });
      return c.id;
    } catch (e) {
      // Eşzamanlı iki getOrCreate yarışı: key tekil, mevcut olanı döndür.
      if (isUniqueConstraintError(e)) {
        const existing = await this.findIdByKey(key);
        if (existing) return existing;
      }
      throw e;
    }
  }

  async listForUser(userId: string): Promise<ConversationSummary[]> {
    // Denormalize alanlar sayesinde konuşma sayısından bağımsız SABİT 2 sorgu (N+1 yok).
    const parts = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, unreadCount: true },
    });
    if (parts.length === 0) return [];
    const unreadMap = new Map(parts.map((p) => [p.conversationId, p.unreadCount]));
    const convs = await prisma.conversation.findMany({
      where: { id: { in: parts.map((p) => p.conversationId) } },
      include: { participants: { select: { userId: true } } },
      orderBy: { lastMessageAt: "desc" },
    });
    return convs.map((c) => ({
      id: c.id,
      otherUserId: c.participants.find((p) => p.userId !== userId)?.userId ?? "",
      lastMessageAt: c.lastMessageAt,
      lastMessageText: c.lastMessageText,
      lastMessageSenderId: c.lastMessageSenderId,
      unreadCount: unreadMap.get(c.id) ?? 0,
    }));
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const row = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { id: true },
    });
    return row !== null;
  }

  async otherUserId(conversationId: string, userId: string): Promise<string | null> {
    const row = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: { not: userId } },
      select: { userId: true },
    });
    return row?.userId ?? null;
  }

  async otherLastReadAt(conversationId: string, userId: string): Promise<Date | null> {
    const row = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: { not: userId } },
      select: { lastReadAt: true },
    });
    return row?.lastReadAt ?? null;
  }

  async recordMessage(conversationId: string, senderId: string, preview: string, at: Date): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: at, lastMessageText: preview, lastMessageSenderId: senderId },
    });
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });
  }

  async markRead(conversationId: string, userId: string, at: Date): Promise<void> {
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: at, unreadCount: 0 },
    });
  }
}

export class PrismaMessageRepository implements MessageRepository {
  async list(conversationId: string, params: CursorParams): Promise<CursorPage<Message>> {
    const limit = Math.min(Math.max(params.limit, 1), 50);
    const decoded = decodeCursor(params.cursor);
    const createdAt = decoded ? new Date(decoded.createdAt) : null;
    const rows = await prisma.message.findMany({
      where: {
        conversationId,
        ...(decoded && createdAt
          ? { OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: decoded.id } }] }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: page.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        text: m.text,
        imageUrl: m.imageUrl,
        createdAt: m.createdAt,
      })),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  async create(data: { conversationId: string; senderId: string; text: string; imageUrl?: string | null; now: Date }): Promise<Message> {
    const m = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        text: data.text,
        imageUrl: data.imageUrl ?? null,
        createdAt: data.now,
      },
    });
    return { id: m.id, conversationId: m.conversationId, senderId: m.senderId, text: m.text, imageUrl: m.imageUrl, createdAt: m.createdAt };
  }
}
