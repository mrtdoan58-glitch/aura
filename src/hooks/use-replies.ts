"use client";

import { useQuery } from "@tanstack/react-query";
import type { CommentDTO } from "@/lib/feed/types";

async function fetchReplies(commentId: string): Promise<{ items: CommentDTO[] }> {
  const res = await fetch(`/api/comments/${commentId}/replies?limit=50`, { credentials: "include" });
  if (!res.ok) throw new Error("Yanıtlar yüklenemedi");
  return res.json();
}

/** Bir yorumun yanıtları — yalnızca genişletildiğinde (enabled) çekilir. */
export function useReplies(commentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["replies", commentId],
    queryFn: () => fetchReplies(commentId),
    enabled,
  });
}
