"use server";

/**
 * Notification action'ları. (Next Server Actions yerleşik origin/CSRF korumasına sahiptir.)
 */
import { getNotificationService } from "@/server/notifications/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function markNotificationsReadAction(): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli." };
  await getNotificationService().markAllRead(user.id);
  return { ok: true, data: null };
}
