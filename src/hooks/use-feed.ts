"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { CursorPageDTO, PostDTO } from "@/lib/feed/types";

async function fetchFeed(cursor: string | null): Promise<CursorPageDTO<PostDTO>> {
  const url = new URL("/api/feed", window.location.origin);
  url.searchParams.set("limit", "8");
  if (cursor) url.searchParams.set("cursor", cursor);
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Feed yüklenemedi");
  return res.json();
}

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
