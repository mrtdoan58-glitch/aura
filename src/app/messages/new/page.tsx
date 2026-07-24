"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, BadgeCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/feed/states";
import { useSearch } from "@/hooks/use-search";
import { startConversationAction } from "@/server/actions/message-actions";
import type { UserResultDTO } from "@/lib/search/types";

export default function NewMessagePage() {
  const [term, setTerm] = useState("");
  const { query, enabled } = useSearch(term);
  const router = useRouter();
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const users = query.data?.users ?? [];

  const start = (u: UserResultDTO) => {
    if (pendingUser) return;
    setPendingUser(u.id);
    setError(null);
    startTransition(async () => {
      const res = await startConversationAction(u.username);
      if (res.ok && res.data) router.push(`/messages/${res.data.conversationId}`);
      else {
        setError(res.error ?? "Konuşma başlatılamadı.");
        setPendingUser(null);
      }
    });
  };

  return (
    <div className="mx-auto flex h-screen max-w-[500px] flex-col">
      <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/messages" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Geri">
          <ArrowLeft className="h-[23px] w-[23px]" />
        </Link>
        <h1 className="text-[17px] font-extrabold tracking-tight">Yeni mesaj</h1>
      </header>

      <div className="px-4 pt-3.5">
        <div className="flex items-center gap-2.5 rounded-full bg-surface-2 px-4 py-3">
          <Search className="h-5 w-5 text-fg-3" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Kişi ara"
            className="flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-fg-3"
          />
        </div>
        {error && <p className="mt-2 px-1 text-[13px] font-medium text-danger">{error}</p>}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!enabled ? (
          <div className="px-4 py-10">
            <EmptyState title="Birini ara" hint="Mesaj göndermek istediğin kişiyi kullanıcı adı ya da isimle bul." />
          </div>
        ) : query.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="skeleton h-[46px] w-[46px] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-2.5 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="px-4 py-10">
            <EmptyState title="Kullanıcı bulunamadı" hint="Farklı bir isim ya da kullanıcı adı dene." />
          </div>
        ) : (
          users.map((u) => (
            <button
              key={u.id}
              onClick={() => start(u)}
              disabled={pendingUser !== null}
              className="flex w-full items-center gap-3.5 px-5 py-2.5 text-left transition-colors hover:bg-surface-2 disabled:opacity-60"
            >
              <Avatar src={u.avatarUrl} size={46} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[14px] font-bold">
                  <span className="truncate">{u.username}</span>
                  {u.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </div>
                <div className="truncate text-[13px] text-fg-3">{u.name}</div>
              </div>
              {pendingUser === u.id && <span className="text-[12px] font-semibold text-fg-3">Açılıyor…</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
