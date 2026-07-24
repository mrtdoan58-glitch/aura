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
    const parts = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });
    if (parts.length === 0) return [];
    const readMap = new Map(parts.map((p) => [p.conversationId, p.lastReadAt]));
    const convs = await prisma.conversation.findMany({
      where: { id: { in: parts.map((p) => p.conversationId) } },
      include: { participants: { select: { userId: true } } },
      orderBy: { lastMessageAt: "desc" },
    });
    return Promise.all(
      convs.map(async (c): Promise<ConversationSummary> => {
        const otherUserId = c.participants.find((p) => p.userId !== userId)?.userId ?? "";
        const last = await prisma.message.findFirst({
          where: { conversationId: c.id },
          orderBy: { createdAt: "desc" },
          select: { text: true, senderId: true, imageUrl: true },
        });
        const lastRead = readMap.get(c.id) ?? new Date(0);
        const unreadCount = await prisma.message.count({
          where: { conversationId: c.id, senderId: { not: userId }, createdAt: { gt: lastRead } },
        });
        return {
          id: c.id,
          otherUserId,
          lastMessageAt: c.lastMessageAt,
          lastMessageText: last ? (last.text || (last.imageUrl ? "📷 Fotoğraf" : "")) : null,
          lastMessageSenderId: last?.senderId ?? null,
          unreadCount,
        };
      })
    );
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

  async touch(conversationId: string, at: Date): Promise<void> {
    await prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: at } });
  }

  async markRead(conversationId: string, userId: string, at: Date): Promise<void> {
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: at },
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
