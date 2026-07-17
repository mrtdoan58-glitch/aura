"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { CursorPageDTO, CommentDTO } from "@/lib/feed/types";

async function fetchComments(postId: string, cursor: string | null): Promise<CursorPageDTO<CommentDTO>> {
  const url = new URL(`/api/posts/${postId}/comments`, window.location.origin);
  url.searchParams.set("limit", "15");
  if (cursor) url.searchParams.set("cursor", cursor);
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Yorumlar yüklenemedi");
  return res.json();
}

export function useComments(postId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
  });
}
