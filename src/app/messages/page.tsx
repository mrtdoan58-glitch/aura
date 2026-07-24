"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, PenSquare } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, ErrorState } from "@/components/feed/states";
import { useConversations } from "@/hooks/use-conversations";
import { relativeTime } from "@/lib/feed/format";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { query, conversations } = useConversations();
  const [term, setTerm] = useState("");

  const t = term.trim().toLowerCase();
  const filtered = t
    ? conversations.filter(
        (c) => c.otherUser.name.toLowerCase().includes(t) || c.otherUser.username.toLowerCase().includes(t)
      )
    : conversations;

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border px-5 py-3.5">
          <h1 className="text-[19px] font-extrabold tracking-tight">Mesajlar</h1>
          <Link href="/messages/new" className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Yeni mesaj">
            <PenSquare className="h-[22px] w-[22px]" />
          </Link>
        </header>

        {conversations.length > 0 && (
          <div className="mx-4 mt-3.5 flex items-center gap-2.5 rounded-full bg-surface-2 px-4 py-3">
            <Search className="h-5 w-5 text-fg-3" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Mesajlarda ara"
              className="flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-fg-3"
            />
          </div>
        )}

        {query.isLoading ? (
          <div className="space-y-1 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3.5 px-1 py-2.5">
                <div className="skeleton h-[56px] w-[56px] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-2.5 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <div className="px-4 py-6">
            <ErrorState onRetry={() => query.refetch()} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-10">
            <EmptyState title="Henüz mesajın yok" hint="Yeni mesaj ile birine yazarak sohbet başlat." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10">
            <EmptyState title="Sonuç yok" hint="Bu isimde bir sohbet bulunamadı." />
          </div>
        ) : (
          <div className="mt-1">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center gap-3.5 px-5 py-2.5 transition-colors hover:bg-surface-2"
              >
                <Avatar src={c.otherUser.avatarUrl} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[14.5px] font-bold">{c.otherUser.name}</span>
                    <span className="shrink-0 pl-2 text-xs font-medium text-fg-3">{relativeTime(c.lastMessageAt)}</span>
                  </div>
                  <div className={cn("mt-0.5 truncate text-[13px]", c.unreadCount ? "font-semibold text-fg" : "text-fg-2")}>
                    {c.lastMessageText
                      ? (c.lastMessageMine ? "Sen: " : "") + c.lastMessageText
                      : "Sohbeti başlat"}
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
        )}
      </div>
    </AppShell>
  );
}
