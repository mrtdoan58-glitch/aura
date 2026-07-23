import { getNotificationService } from "@/server/notifications/container";
import type { NotifyInput } from "@/server/notifications/domain";

export { getNotificationService };

/** Diğer action'lardan (feed/social) çağrılan best-effort bildirim helper'ı. */
export async function notify(input: NotifyInput): Promise<void> {
  await getNotificationService().notify(input);
}
