"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, Heart, Send } from "lucide-react";
import type { StoryDTO } from "@/lib/feed/types";
import { markStorySeenAction } from "@/server/actions/feed-actions";
import { relativeTime } from "@/lib/feed/format";
import { cn } from "@/lib/utils";

const DURATION = 5000;

export function StoryViewer({ stories, start, onClose }: { stories: StoryDTO[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const story = stories[index];

  const next = useCallback(() => {
    setIndex((i) => {
      if (i < stories.length - 1) return i + 1;
      onClose();
      return i;
    });
  }, [stories.length, onClose]);

  const prev = () => setIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    if (!story) return;
    void markStorySeenAction(story.id);
    const t = setTimeout(next, DURATION);
    return () => clearTimeout(t);
  }, [story, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, onClose]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[70] mx-auto flex max-w-[500px] flex-col bg-black">
      <div className="flex gap-1 px-3.5 pb-1.5 pt-3.5">
        {stories.map((_, k) => (
          <div key={k} className="h-[3px] flex-1 overflow-hidden rounded bg-white/30">
            <div
              className={cn("h-full rounded bg-white", k < index && "w-full")}
              style={k === index ? { animation: `storyprogress ${DURATION}ms linear forwards` } : { width: k < index ? "100%" : 0 }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 px-4 py-1.5">
        <Image src={story.author.avatarUrl} alt="" width={38} height={38} className="rounded-full border-2 border-white/30" />
        <div>
          <div className="text-sm font-bold text-white">{story.author.username}</div>
          <div className="text-xs text-white/70">{relativeTime(story.createdAt)}</div>
        </div>
        <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center text-white" aria-label="Kapat">
          <X className="h-[26px] w-[26px]" />
        </button>
      </div>

      {/* Dokunma bölgeleri: sol=geri, sağ=ileri */}
      <div className="relative mx-3 my-2 flex-1 overflow-hidden rounded-[22px]">
        <Image src={story.media.url} alt="" fill className="object-cover" sizes="500px" priority />
        <button className="absolute left-0 top-0 h-full w-1/3" onClick={prev} aria-label="Önceki hikaye" />
        <button className="absolute right-0 top-0 h-full w-1/3" onClick={next} aria-label="Sonraki hikaye" />
      </div>

      <div className="flex items-center gap-3 px-4 pb-7 pt-3.5">
        <div className="flex-1 rounded-full border-[1.5px] border-white/40 px-4 py-3 text-sm text-white/70">Yanıt gönder...</div>
        <Heart className="h-[26px] w-[26px] text-white" />
        <Send className="h-[26px] w-[26px] text-white" />
      </div>
      <style>{`@keyframes storyprogress{to{width:100%}}`}</style>
    </div>
  );
}
