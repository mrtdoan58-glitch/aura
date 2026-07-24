"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { CursorPageDTO, PostDTO } from "@/lib/feed/types";

async function fetchTag(tag: string, cursor: string | null): Promise<CursorPageDTO<PostDTO>> {
  const url = new URL(`/api/tags/${encodeURIComponent(tag)}`, window.location.origin);
  url.searchParams.set("limit", "12");
  if (cursor) url.searchParams.set("cursor", cursor);
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Etiket gönderileri yüklenemedi");
  return res.json();
}

export function useTag(tag: string) {
  return useInfiniteQuery({
    queryKey: ["tag", tag.toLowerCase()],
    queryFn: ({ pageParam }) => fetchTag(tag, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
