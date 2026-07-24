"use client";

import { useEffect } from "react";

/**
 * Bir konuşma kanalına abone olup güncelleme geldiğinde `onUpdate` çağırır (Pusher).
 * NEXT_PUBLIC_PUSHER_KEY yoksa hook hiçbir şey yapmaz — çağıran polling'e güvenmeye
 * devam eder (zarif geri-düşüş). pusher-js yalnızca yapılandırıldığında yüklenir.
 */
export function useConversationRealtime(conversationId: string, onUpdate: () => void) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return; // yapılandırılmadı → gerçek-zamanlı yok, polling devrede

    let cleanup = () => {};
    let cancelled = false;
    import("pusher-js")
      .then(({ default: Pusher }) => {
        if (cancelled) return;
        const pusher = new Pusher(key, { cluster });
        const channelName = `conversation-${conversationId}`;
        const channel = pusher.subscribe(channelName);
        channel.bind("update", onUpdate);
        cleanup = () => {
          channel.unbind_all();
          pusher.unsubscribe(channelName);
          pusher.disconnect();
        };
      })
      .catch(() => {
        /* pusher-js yüklenemezse sessizce polling'e düş */
      });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [conversationId, onUpdate]);
}
