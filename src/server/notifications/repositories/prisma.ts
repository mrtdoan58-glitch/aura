/**
 * Prisma Notification repository (üretim). `prisma generate` gerektirir; tsconfig `exclude`.
 * Okuma yolunda aktör (User) join edilir; Post'a bağlanmaz (postImageUrl denormalize).
 */
import { prisma } from "@/server/db/prisma";
import type { NotificationRepository, NotifyInput, NotificationView } from "@/server/notifications/domain";
import type { CursorParams, CursorPage } from "@/server/feed/domain";
import type { User } from "@/generated/prisma/client";

function toAuthor(user: User) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl ?? "https://i.pravatar.cc/200?img=68",
    verified: user.role !== "USER",
  };
}

export class PrismaNotificationRepository implements NotificationRepository {
  async create(input: NotifyInput): Promise<void> {
    await prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        actorId: input.actor.id,
        type: input.type,
        postId: input.postId ?? null,
        postImageUrl: input.postImageUrl ?? null,
        commentText: input.commentText ?? null,
      },
    });
  }

  async listForUser(userId: string, params: CursorParams): Promise<CursorPage<NotificationView>> {
    const limit = Math.min(Math.max(params.limit, 1), 50);
    const rows = await prisma.notification.findMany({
      where: { recipientId: userId },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const items: NotificationView[] = rows.map((n) => ({
      id: n.id,
      actor: toAuthor(n.actor),
      type: n.type,
      postId: n.postId,
      postImageUrl: n.postImageUrl,
      commentText: n.commentText,
      read: n.read,
      createdAt: n.createdAt,
    }));
    return { items, nextCursor: null };
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({ where: { recipientId: userId, read: false }, data: { read: true } });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { recipientId: userId, read: false } });
  }
}
