"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { CursorPageDTO, PostDTO } from "@/lib/feed/types";

async function fetchProfilePosts(username: string, cursor: string | null): Promise<CursorPageDTO<PostDTO>> {
  const url = new URL(`/api/users/${username}/posts`, window.location.origin);
  url.searchParams.set("limit", "12");
  if (cursor) url.searchParams.set("cursor", cursor);
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Gönderiler yüklenemedi");
  return res.json();
}

export function useProfilePosts(username: string) {
  return useInfiniteQuery({
    queryKey: ["profile-posts", username],
    queryFn: ({ pageParam }) => fetchProfilePosts(username, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
