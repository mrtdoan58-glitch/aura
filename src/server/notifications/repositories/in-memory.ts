/**
 * In-memory Notification repository — testler ve DB'siz dev için.
 * Aktör bilgisini oluşturma anında snapshot'lar (prisma implementasyonu ise read'te join eder).
 */
import { randomUUID } from "node:crypto";
import type { NotificationRepository, NotifyInput, NotificationView } from "@/server/notifications/domain";
import type { CursorParams, CursorPage } from "@/server/feed/domain";

export class InMemoryNotificationRepository implements NotificationRepository {
  private rows: (NotificationView & { recipientId: string })[] = [];

  async create(input: NotifyInput): Promise<void> {
    this.rows.unshift({
      id: randomUUID(),
      recipientId: input.recipientId,
      actor: input.actor,
      type: input.type,
      postId: input.postId ?? null,
      postImageUrl: input.postImageUrl ?? null,
      commentText: input.commentText ?? null,
      read: false,
      createdAt: new Date(),
    });
  }

  async listForUser(userId: string, params: CursorParams): Promise<CursorPage<NotificationView>> {
    const limit = Math.min(Math.max(params.limit, 1), 50);
    const mine = this.rows
      .filter((r) => r.recipientId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const items = mine.slice(0, limit).map((r): NotificationView => ({
      id: r.id, actor: r.actor, type: r.type, postId: r.postId,
      postImageUrl: r.postImageUrl, commentText: r.commentText, read: r.read, createdAt: r.createdAt,
    }));
    return { items, nextCursor: null };
  }

  async markAllRead(userId: string): Promise<void> {
    for (const r of this.rows) if (r.recipientId === userId) r.read = true;
  }

  async countUnread(userId: string): Promise<number> {
    return this.rows.filter((r) => r.recipientId === userId && !r.read).length;
  }
}
