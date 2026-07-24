"use client";

import { useQuery } from "@tanstack/react-query";
import type { ConversationListDTO } from "@/lib/messaging/types";

async function fetchConversations(): Promise<ConversationListDTO> {
  const res = await fetch("/api/conversations", { credentials: "include" });
  if (!res.ok) throw new Error("Konuşmalar yüklenemedi");
  return res.json();
}

export function useConversations() {
  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: 15000, // websocket yok — hafif yoklama
  });
  const conversations = query.data?.conversations ?? [];
  const hasUnread = conversations.some((c) => c.unreadCount > 0);
  return { query, conversations, hasUnread };
}
