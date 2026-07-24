"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCollectionAction, deleteCollectionAction, setPostCollectionAction } from "@/server/actions/feed-actions";
import type { CollectionDTO } from "@/lib/feed/types";

async function fetchCollections(): Promise<{ collections: CollectionDTO[] }> {
  const res = await fetch("/api/collections", { credentials: "include" });
  if (!res.ok) throw new Error("Koleksiyonlar yüklenemedi");
  return res.json();
}

export function useCollections() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["collections"] });
    qc.invalidateQueries({ queryKey: ["saved"] });
  };

  const create = useMutation({
    mutationFn: async (name: string) => {
      const r = await createCollectionAction(name);
      if (!r.ok) throw new Error(r.error ?? "Koleksiyon oluşturulamadı");
      return r.data as CollectionDTO;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (collectionId: string) => {
      const r = await deleteCollectionAction(collectionId);
      if (!r.ok) throw new Error(r.error ?? "Koleksiyon silinemedi");
    },
    onSuccess: invalidate,
  });

  const assign = useMutation({
    mutationFn: async ({ postId, collectionId }: { postId: string; collectionId: string | null }) => {
      const r = await setPostCollectionAction(postId, collectionId);
      if (!r.ok) throw new Error(r.error ?? "Koleksiyona eklenemedi");
    },
    onSuccess: invalidate,
  });

  return { query, collections: query.data?.collections ?? [], create, remove, assign };
}
