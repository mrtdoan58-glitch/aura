"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createHighlightAction, deleteHighlightAction } from "@/server/actions/feed-actions";
import type { HighlightDTO, HighlightItemDTO, StoryDTO } from "@/lib/feed/types";

async function fetchHighlights(userId: string): Promise<{ highlights: HighlightDTO[] }> {
  const res = await fetch(`/api/highlights?userId=${encodeURIComponent(userId)}`, { credentials: "include" });
  if (!res.ok) throw new Error("Vurgular yüklenemedi");
  return res.json();
}

export function useHighlights(userId: string) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["highlights", userId], queryFn: () => fetchHighlights(userId) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["highlights", userId] });

  const create = useMutation({
    mutationFn: async ({ title, storyIds }: { title: string; storyIds: string[] }) => {
      const r = await createHighlightAction(title, storyIds);
      if (!r.ok) throw new Error(r.error ?? "Vurgu oluşturulamadı");
      return r.data as HighlightDTO;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (highlightId: string) => {
      const r = await deleteHighlightAction(highlightId);
      if (!r.ok) throw new Error(r.error ?? "Vurgu silinemedi");
    },
    onSuccess: invalidate,
  });

  return { query, highlights: query.data?.highlights ?? [], create, remove };
}

/** Kendi hikaye arşivi — vurgu oluşturma sayfasındaki seçim listesi. */
export function useStoryArchive(enabled: boolean) {
  return useQuery({
    queryKey: ["story-archive"],
    enabled,
    queryFn: async (): Promise<{ items: StoryDTO[] }> => {
      const res = await fetch("/api/stories/archive", { credentials: "include" });
      if (!res.ok) throw new Error("Hikaye arşivi yüklenemedi");
      return res.json();
    },
  });
}

/** Bir vurgunun öğeleri — açıldığında çekilir. */
export async function fetchHighlightItems(id: string): Promise<HighlightItemDTO[]> {
  const res = await fetch(`/api/highlights/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Vurgu açılamadı");
  const data: { items: HighlightItemDTO[] } = await res.json();
  return data.items;
}
