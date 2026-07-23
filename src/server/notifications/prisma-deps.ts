/**
 * Notifications üretim bağımlılıkları. `prisma generate` gerektirir; tsconfig `exclude`.
 * Follow-back durumu için doğrudan PrismaFollowRepository (durumsuz; aynı DB'yi okur).
 */
import type { NotificationDeps } from "@/server/notifications/services/notification-service";
import { PrismaNotificationRepository } from "@/server/notifications/repositories/prisma";
import { PrismaFollowRepository } from "@/server/social/repositories/prisma";

export function buildPrismaNotificationDeps(): NotificationDeps {
  return {
    repo: new PrismaNotificationRepository(),
    follows: new PrismaFollowRepository(),
  };
}
