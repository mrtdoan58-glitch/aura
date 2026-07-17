"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Plus } from "lucide-react";
import type { CursorPageDTO, StoryDTO } from "@/lib/feed/types";
import { cn } from "@/lib/utils";

async function fetchStories(): Promise<CursorPageDTO<StoryDTO>> {
  const res = await fetch("/api/stories", { credentials: "include" });
  if (!res.ok) throw new Error("Hikayeler yüklenemedi");
  return res.json();
}

export function StoryRail({ onOpen }: { onOpen: (stories: StoryDTO[], index: number) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ["stories"], queryFn: fetchStories });
  const stories = data?.items ?? [];

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
      <button className="flex w-[66px] shrink-0 flex-col items-center gap-1.5" aria-label="Hikayen ekle">
        <div className="relative h-[66px] w-[66px] rounded-full bg-border p-[2.5px]">
          <Image src="https://i.pravatar.cc/200?img=68" alt="" width={66} height={66} className="h-full w-full rounded-full border-[2.5px] border-bg object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 grid h-[22px] w-[22px] place-items-center rounded-full border-[2.5px] border-bg bg-primary">
            <Plus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          </span>
        </div>
        <span className="max-w-[64px] truncate text-[11.5px] font-medium text-fg-2">Hikayen</span>
      </button>

      {stories.map((s, i) => (
        <button key={s.id} onClick={() => onOpen(stories, i)} className="flex w-[66px] shrink-0 flex-col items-center gap-1.5">
          <div className={cn("h-[66px] w-[66px] rounded-full p-[2.5px] transition-transform active:scale-95", s.seenByMe ? "bg-border" : "story-ring")}>
            <Image src={s.author.avatarUrl} alt={s.author.username} width={66} height={66} className="h-full w-full rounded-full border-[2.5px] border-bg object-cover" />
          </div>
          <span className="max-w-[64px] truncate text-[11.5px] font-medium text-fg-2">{s.author.username}</span>
        </button>
      ))}
    </div>
  );
}
