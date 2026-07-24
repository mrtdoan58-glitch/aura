"use client";

import { useState } from "react";
import { Bookmark, Check, ChevronDown } from "lucide-react";
import { useCollections } from "@/hooks/use-collections";
import { cn } from "@/lib/utils";

/** Kaydedilmiş bir gönderiyi koleksiyona taşı/çıkar (post-detay sayfasında). */
export function CollectionPicker({ postId, initialCollectionId }: { postId: string; initialCollectionId: string | null }) {
  const { collections, assign } = useCollections();
  const [current, setCurrent] = useState<string | null>(initialCollectionId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentName = collections.find((c) => c.id === current)?.name ?? null;

  const pick = (collectionId: string | null) => {
    const prev = current;
    setCurrent(collectionId);
    setOpen(false);
    setError(null);
    assign.mutate(
      { postId, collectionId },
      { onError: (e) => { setCurrent(prev); setError(e instanceof Error ? e.message : "Kaydedilemedi"); } }
    );
  };

  return (
    <div className="border-t border-border px-5 py-3">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 text-[13.5px]">
        <Bookmark className="h-[17px] w-[17px] text-fg-2" />
        <span className="font-semibold text-fg-2">Koleksiyon</span>
        <span className="ml-auto flex items-center gap-1 text-fg-3">
          {currentName ?? "Seç"}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-0.5">
          {collections.length === 0 && (
            <p className="px-1 py-1.5 text-[12.5px] text-fg-3">
              Henüz koleksiyon yok — Kaydedilenler sayfasından oluşturabilirsin.
            </p>
          )}
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13.5px] hover:bg-surface-2"
            >
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-[12px] text-fg-3">{c.postCount}</span>
              {current === c.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
          {current && (
            <button
              onClick={() => pick(null)}
              className="w-full rounded-lg px-2 py-2 text-left text-[13px] font-semibold text-danger hover:bg-surface-2"
            >
              Koleksiyondan çıkar
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}
