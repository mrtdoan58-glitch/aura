"use client";

import Link from "next/link";
import { Search, PenSquare } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { conversations } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border px-5 py-3.5">
          <h1 className="text-[19px] font-extrabold tracking-tight">Mesajlar</h1>
          <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Yeni mesaj">
            <PenSquare className="h-[22px] w-[22px]" />
          </button>
        </header>
        <div className="mx-4 mt-3.5 flex items-center gap-2.5 rounded-full bg-surface-2 px-4 py-3">
          <Search className="h-5 w-5 text-fg-3" />
          <input placeholder="Mesajlarda ara" className="flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-fg-3" />
        </div>
        <div className="mt-1">
          {conversations.map((c) => (
            <Link key={c.id} href={`/messages/${c.id}`} className="flex items-center gap-3.5 px-5 py-2.5 transition-colors hover:bg-surface-2">
              <Avatar src={c.user.avatar} size={56} online={c.user.online} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[14.5px] font-bold">{c.user.name}</span>
                  <span className="text-xs font-medium text-fg-3">{c.time}</span>
                </div>
                <div className={cn("mt-0.5 truncate text-[13px]", c.unreadCount ? "font-semibold text-fg" : "text-fg-2")}>
                  {c.preview}
                </div>
              </div>
              {c.unreadCount > 0 && (
                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
