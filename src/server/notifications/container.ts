/**
 * Notifications kompozisyon kökü. Varsayılan in-memory; üretimde configureNotificationDeps.
 * Follow-back durumu için social'ın paylaşılan in-memory follow store'unu yeniden kullanır
 * (notifications → social → feed; geri döngü yok).
 */
import { NotificationService, type NotificationDeps } from "@/server/notifications/services/notification-service";
import { InMemoryNotificationRepository } from "@/server/notifications/repositories/in-memory";
import { buildInMemorySocialDeps } from "@/server/social/container";

const globalForNotifContainer = globalThis as unknown as {
  __auraNotifInjectedDeps?: NotificationDeps | null;
  __auraNotifCached?: NotificationService | null;
  __auraNotifRepo?: InMemoryNotificationRepository | null;
};

export function buildInMemoryNotificationDeps(): NotificationDeps {
  // Bildirimler de Server Action/RSC chunk ayrımı nedeniyle globalThis'te tutulur.
  if (!globalForNotifContainer.__auraNotifRepo) {
    globalForNotifContainer.__auraNotifRepo = new InMemoryNotificationRepository();
  }
  return {
    repo: globalForNotifContainer.__auraNotifRepo,
    follows: buildInMemorySocialDeps().follows,
  };
}

export function configureNotificationDeps(deps: NotificationDeps): void {
  globalForNotifContainer.__auraNotifInjectedDeps = deps;
  globalForNotifContainer.__auraNotifCached = null;
}

export function getNotificationService(): NotificationService {
  if (!globalForNotifContainer.__auraNotifCached) {
    globalForNotifContainer.__auraNotifCached = new NotificationService(
      globalForNotifContainer.__auraNotifInjectedDeps ?? buildInMemoryNotificationDeps()
    );
  }
  return globalForNotifContainer.__auraNotifCached;
}
