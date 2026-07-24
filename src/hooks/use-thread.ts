"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendMessageAction, sendImageMessageAction, reactToMessageAction } from "@/server/actions/message-actions";
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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["thread", id] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
  };

  const send = useMutation({
    mutationFn: async (text: string) => {
      const res = await sendMessageAction(id, text);
      if (!res.ok) throw new Error(res.error ?? "Mesaj gönderilemedi");
      return res.data;
    },
    onSuccess: invalidate,
  });

  const sendImage = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.set("conversationId", id);
      fd.set("image", file);
      const res = await sendImageMessageAction(fd);
      if (!res.ok) throw new Error(res.error ?? "Fotoğraf gönderilemedi");
      return res.data;
    },
    onSuccess: invalidate,
  });

  const react = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string | null }) => {
      const res = await reactToMessageAction(messageId, emoji);
      if (!res.ok) throw new Error(res.error ?? "Tepki verilemedi");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["thread", id] }),
  });

  return { query, send, sendImage, react };
}
