"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { CursorPageDTO, PostDTO } from "@/lib/feed/types";

async function fetchSaved(cursor: string | null): Promise<CursorPageDTO<PostDTO>> {
  const url = new URL("/api/saved", window.location.origin);
  url.searchParams.set("limit", "12");
  if (cursor) url.searchParams.set("cursor", cursor);
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Kaydedilenler yüklenemedi");
  return res.json();
}

export function useSaved() {
  return useInfiniteQuery({
    queryKey: ["saved"],
    queryFn: ({ pageParam }) => fetchSaved(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
