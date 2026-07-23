"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { markNotificationsReadAction } from "@/server/actions/notification-actions";
import type { NotificationListDTO } from "@/lib/notifications/types";

async function fetchNotifications(): Promise<NotificationListDTO> {
  const res = await fetch("/api/notifications?limit=40", { credentials: "include" });
  if (!res.ok) throw new Error("Bildirimler yüklenemedi");
  return res.json();
}

export function useNotifications() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });

  const markAllRead = useMutation({
    mutationFn: () => markNotificationsReadAction(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return { query, markAllRead };
}
