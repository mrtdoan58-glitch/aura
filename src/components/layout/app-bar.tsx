"use client";

import Link from "next/link";
import { Sparkles, Search, Heart, Send } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AppBar() {
  return (
    <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border px-5 py-3">
      <Link href="/" className="flex items-center gap-2.5 text-[21px] font-extrabold tracking-tight">
        <span className="story-ring grid h-[30px] w-[30px] place-items-center rounded-[9px] shadow-[0_4px_12px_rgba(79,70,229,0.4)]">
          <Sparkles className="h-[17px] w-[17px] text-white" />
        </span>
        Aura
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Link href="/explore">
          <IconButton>
            <Search className="h-[22px] w-[22px]" strokeWidth={1.8} />
          </IconButton>
        </Link>
        <Link href="/notifications">
          <IconButton badge>
            <Heart className="h-[22px] w-[22px]" strokeWidth={1.8} />
          </IconButton>
        </Link>
        <Link href="/messages">
          <IconButton badge>
            <Send className="h-[22px] w-[22px]" strokeWidth={1.8} />
          </IconButton>
        </Link>
      </div>
    </header>
  );
}
