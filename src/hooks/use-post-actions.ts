"use client";

import { useQueryClient, useMutation, type InfiniteData } from "@tanstack/react-query";
import { toggleLikeAction, toggleSaveAction, createPostAction } from "@/server/actions/feed-actions";
import type { CursorPageDTO, PostDTO } from "@/lib/feed/types";

type FeedData = InfiniteData<CursorPageDTO<PostDTO>>;

/** Feed cache'inde tek bir gönderiyi günceller (optimistic + rollback için ortak). */
function patchPost(data: FeedData | undefined, postId: string, patch: (p: PostDTO) => PostDTO): FeedData | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((p) => (p.id === postId ? patch(p) : p)),
    })),
  };
}

export function usePostActions() {
  const qc = useQueryClient();

  const like = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) => toggleLikeAction(postId, liked),
    onMutate: async ({ postId, liked }) => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      const prev = qc.getQueryData<FeedData>(["feed"]);
      qc.setQueryData<FeedData>(["feed"], (d) =>
        patchPost(d, postId, (p) => ({
          ...p,
          likedByMe: liked,
          likeCount: Math.max(0, p.likeCount + (liked ? 1 : -1)),
        }))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["feed"], ctx.prev);
    },
    onSettled: (res, _e, { postId }) => {
      // Sunucu gerçek sayacı döndürdüyse senkronla
      if (res?.ok && res.data) {
        qc.setQueryData<FeedData>(["feed"], (d) =>
          patchPost(d, postId, (p) => ({ ...p, likeCount: res.data!.likeCount, likedByMe: res.data!.liked }))
        );
      }
    },
  });

  const save = useMutation({
    mutationFn: ({ postId, saved }: { postId: string; saved: boolean }) => toggleSaveAction(postId, saved),
    onMutate: async ({ postId, saved }) => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      const prev = qc.getQueryData<FeedData>(["feed"]);
      qc.setQueryData<FeedData>(["feed"], (d) => patchPost(d, postId, (p) => ({ ...p, savedByMe: saved })));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["feed"], ctx.prev);
    },
  });

  const create = useMutation({
    mutationFn: (formData: FormData) => createPostAction(formData),
    onSuccess: (res) => {
      if (res.ok) qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return { like, save, create };
}
