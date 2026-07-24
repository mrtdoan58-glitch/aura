"use client";

import { useState } from "react";
import { Plus, X, Trash2, Check } from "lucide-react";
import { useCollections } from "@/hooks/use-collections";
import { SavedPostsGrid } from "@/components/feed/saved-posts-grid";
import { cn } from "@/lib/utils";

/** Kaydedilenler: "Tümü" + koleksiyon sekmeleri, koleksiyon oluştur/sil. */
export function SavedCollections() {
  const { collections, create, remove } = useCollections();
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const active = collections.find((c) => c.id === activeId);

  const submitNew = () => {
    const v = name.trim();
    if (!v) return;
    setError(null);
    create.mutate(v, {
      onSuccess: (c) => {
        setName("");
        setCreating(false);
        setActiveId(c.id);
      },
      onError: (e) => setError(e instanceof Error ? e.message : "Oluşturulamadı"),
    });
  };

  const deleteActive = () => {
    if (!active) return;
    remove.mutate(active.id, { onSuccess: () => setActiveId(undefined) });
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        <button
          onClick={() => setActiveId(undefined)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all active:scale-95",
            activeId === undefined ? "bg-fg text-bg" : "bg-surface-2 text-fg-2"
          )}
        >
          Tümü
        </button>
        {collections.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all active:scale-95",
              activeId === c.id ? "bg-fg text-bg" : "bg-surface-2 text-fg-2"
            )}
          >
            {c.name} <span className="opacity-60">{c.postCount}</span>
          </button>
        ))}
        <button
          onClick={() => setCreating((v) => !v)}
          aria-label="Yeni koleksiyon"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-fg-2 active:scale-95"
        >
          {creating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {creating && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitNew()}
              maxLength={40}
              placeholder="Koleksiyon adı"
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-fg-3"
            />
            <button
              onClick={submitNew}
              disabled={!name.trim() || create.isPending}
              aria-label="Oluştur"
              className="grid h-7 w-7 place-items-center rounded-full bg-primary text-white disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
          {error && <p className="mt-1.5 px-1 text-[12.5px] text-danger">{error}</p>}
        </div>
      )}

      {active && (
        <div className="flex items-center justify-between px-5 pb-2">
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-fg-3">{active.name}</span>
          <button
            onClick={deleteActive}
            disabled={remove.isPending}
            className="flex items-center gap-1 text-[12.5px] font-semibold text-danger disabled:opacity-50"
          >
            <Trash2 className="h-[15px] w-[15px]" /> Koleksiyonu sil
          </button>
        </div>
      )}

      <SavedPostsGrid collectionId={activeId} />
    </div>
  );
}
