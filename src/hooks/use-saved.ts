"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { CursorPageDTO, PostDTO } from "@/lib/feed/types";

async function fetchSaved(cursor: string | null, collectionId?: string): Promise<CursorPageDTO<PostDTO>> {
  const url = new URL("/api/saved", window.location.origin);
  url.searchParams.set("limit", "12");
  if (cursor) url.searchParams.set("cursor", cursor);
  if (collectionId) url.searchParams.set("collection", collectionId);
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Kaydedilenler yüklenemedi");
  return res.json();
}

/** `collectionId` verilmezse tüm kaydedilenler ("Tümü" sekmesi). */
export function useSaved(collectionId?: string) {
  return useInfiniteQuery({
    queryKey: ["saved", collectionId ?? "all"],
    queryFn: ({ pageParam }) => fetchSaved(pageParam, collectionId),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
