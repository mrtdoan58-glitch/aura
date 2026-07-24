"use client";

import { useState } from "react";
import { AppBar } from "@/components/layout/app-bar";
import { StoryRail } from "@/components/feed/story-rail";
import { StoryViewer } from "@/components/feed/story-viewer";
import { FeedList } from "@/components/feed/feed-list";
import type { StoryDTO } from "@/lib/feed/types";

/** Ana sayfanın istemci kısmı; oturum bilgisi sunucudan prop olarak gelir. */
export function HomeClient({ viewer }: { viewer: { username: string; avatarUrl: string } | null }) {
  const [open, setOpen] = useState<{ stories: StoryDTO[]; index: number } | null>(null);
  const current = open?.stories[open.index];

  return (
    <>
      <div className="mx-auto max-w-[500px]">
        <AppBar />
        <StoryRail viewer={viewer} onOpen={(stories, index) => setOpen({ stories, index })} />
        <FeedList />
      </div>
      {open && (
        <StoryViewer
          stories={open.stories}
          start={open.index}
          onClose={() => setOpen(null)}
          // kendi hikayene ve çıkış yapmışken yanıt yok
          canReply={!!viewer && current?.author.username !== viewer.username}
        />
      )}
    </>
  );
}
