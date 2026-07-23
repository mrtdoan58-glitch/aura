"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { CursorPageDTO, PostDTO } from "@/lib/feed/types";

async function fetchExplore(cursor: string | null): Promise<CursorPageDTO<PostDTO>> {
  const url = new URL("/api/explore", window.location.origin);
  url.searchParams.set("limit", "18");
  if (cursor) url.searchParams.set("cursor", cursor);
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Keşfet yüklenemedi");
  return res.json();
}

export function useExplore() {
  return useInfiniteQuery({
    queryKey: ["explore"],
    queryFn: ({ pageParam }) => fetchExplore(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
