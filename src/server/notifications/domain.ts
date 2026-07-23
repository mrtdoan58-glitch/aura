/**
 * Notifications domain — gerçek olaylardan (takip/beğeni/yorum) üretilen bildirimler.
 * `Author`, `CursorParams`, `CursorPage` feed domain'inden yeniden kullanılır (tip-only).
 */
import type { Author, CursorParams, CursorPage } from "@/server/feed/domain";

export type NotificationType = "FOLLOW" | "LIKE" | "COMMENT";

export interface NotifyInput {
  recipientId: string;
  actor: Author;
  type: NotificationType;
  postId?: string | null;
  postImageUrl?: string | null;
  commentText?: string | null;
}

/** Okuma yolunda aktör bilgisiyle zenginleştirilmiş görünüm (in-memory snapshot / prisma join). */
export interface NotificationView {
  id: string;
  actor: Author;
  type: NotificationType;
  postId: string | null;
  postImageUrl: string | null;
  commentText: string | null;
  read: boolean;
  createdAt: Date;
}

export interface NotificationRepository {
  create(input: NotifyInput): Promise<void>;
  listForUser(userId: string, params: CursorParams): Promise<CursorPage<NotificationView>>;
  markAllRead(userId: string): Promise<void>;
  countUnread(userId: string): Promise<number>;
}

/** Follow-back butonunun durumu için minimal port — social'ın FollowRepository'si bunu karşılar. */
export interface FollowLookup {
  exists(followerId: string, followingId: string): Promise<boolean>;
}
