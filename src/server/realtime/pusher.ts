/**
 * Opsiyonel gerçek-zamanlı katman (Pusher). Env yoksa no-op — istemci mevcut
 * polling'e düşer (Upstash/Blob/Sentry ile aynı "opsiyonel entegrasyon" deseni).
 */
import Pusher from "pusher";
import { getEnv } from "@/lib/env";

let cached: Pusher | null | undefined;

function getClient(): Pusher | null {
  if (cached !== undefined) return cached;
  const env = getEnv();
  if (env.PUSHER_APP_ID && env.NEXT_PUBLIC_PUSHER_KEY && env.PUSHER_SECRET && env.NEXT_PUBLIC_PUSHER_CLUSTER) {
    cached = new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.NEXT_PUBLIC_PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });
  } else {
    cached = null;
  }
  return cached;
}

/**
 * Bir konuşma kanalına "güncelleme oldu" sinyali gönderir (içerik taşımaz — istemci
 * yalnızca yeniden çeker; içerik yolu sunucuda yetki-korumalı). Best-effort.
 */
export async function publishConversationUpdate(conversationId: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    await client.trigger(`conversation-${conversationId}`, "update", {});
  } catch {
    /* gerçek-zamanlı hatası mesaj/okuma işlemini bozmaz */
  }
}
