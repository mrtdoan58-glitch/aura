"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendMessageAction } from "@/server/actions/message-actions";
import type { ThreadDTO } from "@/lib/messaging/types";

async function fetchThread(id: string): Promise<ThreadDTO> {
  const res = await fetch(`/api/conversations/${id}/messages?limit=50`, { credentials: "include" });
  if (!res.ok) throw new Error("Mesajlar yüklenemedi");
  return res.json();
}

export function useThread(id: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["thread", id],
    queryFn: () => fetchThread(id),
    refetchInterval: 5000, // gelen mesajları yakala (websocket yok)
  });

  const send = useMutation({
    mutationFn: async (text: string) => {
      const res = await sendMessageAction(id, text);
      if (!res.ok) throw new Error(res.error ?? "Mesaj gönderilemedi");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["thread", id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return { query, send };
}
