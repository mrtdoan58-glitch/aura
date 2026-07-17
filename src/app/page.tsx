"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppBar } from "@/components/layout/app-bar";
import { StoryRail } from "@/components/feed/story-rail";
import { StoryViewer } from "@/components/feed/story-viewer";
import { FeedList } from "@/components/feed/feed-list";
import type { StoryDTO } from "@/lib/feed/types";

export default function HomePage() {
  const [viewer, setViewer] = useState<{ stories: StoryDTO[]; index: number } | null>(null);

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <AppBar />
        <StoryRail onOpen={(stories, index) => setViewer({ stories, index })} />
        <FeedList />
      </div>
      {viewer && (
        <StoryViewer stories={viewer.stories} start={viewer.index} onClose={() => setViewer(null)} />
      )}
    </AppShell>
  );
}
