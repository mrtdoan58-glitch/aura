"use client";

import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Plus, Loader2 } from "lucide-react";
import type { CursorPageDTO, StoryDTO } from "@/lib/feed/types";
import { createStoryAction } from "@/server/actions/feed-actions";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

async function fetchStories(): Promise<CursorPageDTO<StoryDTO>> {
  const res = await fetch("/api/stories", { credentials: "include" });
  if (!res.ok) throw new Error("Hikayeler yüklenemedi");
  return res.json();
}

export function StoryRail({
  viewer,
  onOpen,
}: {
  /** Oturum sahibi; null ise "Hikayen ekle" düğmesi gösterilmez. */
  viewer: { username: string; avatarUrl: string } | null;
  onOpen: (stories: StoryDTO[], index: number) => void;
}) {
  const qc = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useQuery({ queryKey: ["stories"], queryFn: fetchStories });
  const stories = data?.items ?? [];

  const create = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.set("media", file);
      return createStoryAction(fd);
    },
    onSuccess: (res) => {
      if (res.ok) {
        showToast("Hikayen paylaşıldı");
        qc.invalidateQueries({ queryKey: ["stories"] });
      } else {
        showToast(res.error ?? "Hikaye paylaşılamadı");
      }
    },
  });

  if (isLoading)
    return (
      <div className="flex gap-4 px-5 pb-3 pt-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="skeleton h-[66px] w-[66px] rounded-full" />
            <div className="skeleton h-2.5 w-10 rounded" />
          </div>
        ))}
      </div>
    );

  return (
    <div className="flex gap-4 overflow-x-auto px-5 pb-3 pt-4" style={{ scrollbarWidth: "none" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) create.mutate(file);
          e.target.value = "";
        }}
      />
      {viewer && (
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={create.isPending}
        className="flex w-[66px] shrink-0 flex-col items-center gap-1.5"
        aria-label="Hikayen ekle"
      >
        <div className="relative h-[66px] w-[66px] rounded-full bg-border p-[2.5px]">
          <Image src={viewer.avatarUrl} alt="" width={66} height={66} className="h-full w-full rounded-full border-[2.5px] border-bg object-cover" />
          {create.isPending ? (
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </span>
          ) : (
            <span className="absolute -bottom-0.5 -right-0.5 grid h-[22px] w-[22px] place-items-center rounded-full border-[2.5px] border-bg bg-primary">
              <Plus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            </span>
          )}
        </div>
        <span className="max-w-[64px] truncate text-[11.5px] font-medium text-fg-2">Hikayen</span>
      </button>
      )}

      {stories.map((s, i) => (
        <button key={s.id} onClick={() => onOpen(stories, i)} className="flex w-[66px] shrink-0 flex-col items-center gap-1.5">
          <div className={cn("h-[66px] w-[66px] rounded-full p-[2.5px] transition-transform active:scale-95", s.seenByMe ? "bg-border" : "story-ring")}>
            {/* alt="" — kullanıcı adı hemen altındaki <span> ile zaten görünür, tekrar yersiz */}
            <Image src={s.author.avatarUrl} alt="" width={66} height={66} className="h-full w-full rounded-full border-[2.5px] border-bg object-cover" />
          </div>
          <span className="max-w-[64px] truncate text-[11.5px] font-medium text-fg-2">{s.author.username}</span>
        </button>
      ))}
    </div>
  );
}
