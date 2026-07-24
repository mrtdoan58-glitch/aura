"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { useHighlights, useStoryArchive, fetchHighlightItems } from "@/hooks/use-highlights";
import { StoryViewer } from "@/components/feed/story-viewer";
import type { AuthorDTO, StoryDTO } from "@/lib/feed/types";
import { cn } from "@/lib/utils";

/**
 * Profil vurguları. Vurgu öğeleri hikaye görüntüleyicide açılır (görüldü işaretlenmez:
 * öğeler hikayenin kopyasıdır, kaynak hikaye silinmiş olabilir).
 */
export function ProfileHighlights({ author, isOwner }: { author: AuthorDTO; isOwner: boolean }) {
  const { highlights, create, remove, query } = useHighlights(author.id);
  const [sheet, setSheet] = useState(false);
  const [open, setOpen] = useState<StoryDTO[] | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const openHighlight = async (id: string, title: string) => {
    setLoadingId(id);
    try {
      const items = await fetchHighlightItems(id);
      if (items.length === 0) return;
      setOpen(
        items.map((it) => ({
          id: it.id,
          author: { ...author, username: title },
          media: { id: it.id, type: it.type, url: it.url, posterUrl: null, width: 1080, height: 1350, blurDataUrl: null, order: 0 },
          createdAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
          seenByMe: false,
        }))
      );
    } finally {
      setLoadingId(null);
    }
  };

  if (query.isLoading) return null;
  if (highlights.length === 0 && !isOwner) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-5 py-3" style={{ scrollbarWidth: "none" }}>
        {isOwner && (
          <button onClick={() => setSheet(true)} className="flex w-[64px] shrink-0 flex-col items-center gap-1.5" aria-label="Yeni vurgu">
            <span className="grid h-[62px] w-[62px] place-items-center rounded-full border-2 border-dashed border-border text-fg-3">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-[11.5px] font-medium text-fg-2">Yeni</span>
          </button>
        )}
        {highlights.map((h) => (
          <button
            key={h.id}
            onClick={() => openHighlight(h.id, h.title)}
            className="flex w-[64px] shrink-0 flex-col items-center gap-1.5 active:scale-95"
          >
            <span className="relative grid h-[62px] w-[62px] place-items-center overflow-hidden rounded-full border-2 border-border bg-surface-2">
              {h.coverUrl && <Image src={h.coverUrl} alt="" fill className="object-cover" sizes="62px" />}
              {loadingId === h.id && (
                <span className="absolute inset-0 grid place-items-center bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </span>
              )}
            </span>
            <span className="max-w-[64px] truncate text-[11.5px] font-medium text-fg-2">{h.title}</span>
          </button>
        ))}
      </div>

      {sheet && (
        <HighlightSheet
          onClose={() => setSheet(false)}
          onCreate={(title, storyIds) =>
            new Promise((resolve, reject) =>
              create.mutate({ title, storyIds }, { onSuccess: () => resolve(), onError: (e) => reject(e) })
            )
          }
          highlights={highlights.map((h) => ({ id: h.id, title: h.title, coverUrl: h.coverUrl }))}
          onDelete={(id) => remove.mutate(id)}
        />
      )}

      {open && <StoryViewer stories={open} start={0} onClose={() => setOpen(null)} markSeen={false} canReply={false} />}
    </>
  );
}

function HighlightSheet({
  onClose,
  onCreate,
  highlights,
  onDelete,
}: {
  onClose: () => void;
  onCreate: (title: string, storyIds: string[]) => Promise<void>;
  highlights: { id: string; title: string; coverUrl: string | null }[];
  onDelete: (id: string) => void;
}) {
  const archive = useStoryArchive(true);
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const stories = archive.data?.items ?? [];

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      await onCreate(title, picked);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vurgu oluşturulamadı");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-[500px] overflow-y-auto rounded-t-[22px] bg-bg pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass sticky top-0 flex items-center gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-[16px] font-extrabold">Vurgular</h2>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={30}
            placeholder="Vurgu adı (ör. Seyahat)"
            className="w-full rounded-full bg-surface-2 px-4 py-2.5 text-[14px] outline-none placeholder:text-fg-3"
          />
          <p className="mt-3 text-[12px] font-extrabold uppercase tracking-wider text-fg-3">
            Hikayelerinden seç {picked.length > 0 && `· ${picked.length}`}
          </p>
        </div>

        {archive.isLoading ? (
          <div className="grid grid-cols-3 gap-1 px-5 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton aspect-[9/16] rounded-lg" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <p className="px-5 pt-2 text-[13px] text-fg-3">
            Henüz hikayen yok. Ana sayfadan bir hikaye paylaş, sonra buradan vurgu oluşturabilirsin.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1 px-5 pt-2">
            {stories.map((s) => {
              const i = picked.indexOf(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "relative aspect-[9/16] overflow-hidden rounded-lg border-2",
                    i >= 0 ? "border-primary" : "border-transparent"
                  )}
                >
                  <Image src={s.media.url} alt="" fill className="object-cover" sizes="160px" />
                  {i >= 0 && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="px-5 pt-2 text-[12.5px] text-danger">{error}</p>}

        <div className="px-5 pt-4">
          <button
            onClick={submit}
            disabled={!title.trim() || picked.length === 0 || saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[14px] font-bold text-white disabled:opacity-40"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Vurgu oluştur
          </button>
        </div>

        {highlights.length > 0 && (
          <div className="mt-6 border-t border-border px-5 pt-4">
            <p className="text-[12px] font-extrabold uppercase tracking-wider text-fg-3">Mevcut vurgular</p>
            <ul className="mt-2 space-y-1">
              {highlights.map((h) => (
                <li key={h.id} className="flex items-center gap-3 py-1.5">
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-2">
                    {h.coverUrl && <Image src={h.coverUrl} alt="" fill className="object-cover" sizes="36px" />}
                  </span>
                  <span className="flex-1 truncate text-[14px]">{h.title}</span>
                  <button
                    onClick={() => onDelete(h.id)}
                    className="grid h-9 w-9 place-items-center rounded-full text-danger hover:bg-surface-2"
                    aria-label={`${h.title} vurgusunu sil`}
                  >
                    <Trash2 className="h-[17px] w-[17px]" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="h-2" />
      </div>
    </div>
  );
}
