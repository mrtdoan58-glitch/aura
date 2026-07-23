/**
 * NotificationService — bildirim yazma (best-effort) ve okuma iş kuralları.
 * notify() asla çağıranı (like/follow action'ını) bozmaz: hataları içeride yutar.
 */
import type {
  NotificationRepository, NotifyInput, NotificationView, FollowLookup,
} from "@/server/notifications/domain";

export interface NotificationDeps {
  repo: NotificationRepository;
  follows: FollowLookup;
}

/** İstemciye dönen görünüm: FOLLOW satırlarında follow-back butonu için ek durum. */
export interface NotificationWithState extends NotificationView {
  viewerFollowsActor: boolean;
}

export interface NotificationListResult {
  items: NotificationWithState[];
  unreadCount: number;
}

export class NotificationService {
  constructor(private readonly deps: NotificationDeps) {}

  /** Kendine bildirim gönderilmez; hata çağıran akışı bozmamalı (best-effort). */
  async notify(input: NotifyInput): Promise<void> {
    if (input.recipientId === input.actor.id) return;
    try {
      await this.deps.repo.create(input);
    } catch {
      /* bildirim yazımı başarısız olsa da asıl işlem (beğeni/takip) etkilenmez */
    }
  }

  async list(userId: string, params: { cursor?: string | null; limit?: number }): Promise<NotificationListResult> {
    const limit = params.limit && params.limit > 0 ? params.limit : 40;
    const [page, unreadCount] = await Promise.all([
      this.deps.repo.listForUser(userId, { cursor: params.cursor, limit }),
      this.deps.repo.countUnread(userId),
    ]);
    const items = await Promise.all(
      page.items.map(async (n) => ({
        ...n,
        viewerFollowsActor: n.type === "FOLLOW" ? await this.deps.follows.exists(userId, n.actor.id) : false,
      }))
    );
    return { items, unreadCount };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.deps.repo.markAllRead(userId);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.deps.repo.countUnread(userId);
  }
}
