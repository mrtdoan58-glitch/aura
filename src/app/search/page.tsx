"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, BadgeCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, ErrorState } from "@/components/feed/states";
import { useSearch } from "@/hooks/use-search";
import { toggleFollowAction } from "@/server/actions/social-actions";
import { cn } from "@/lib/utils";
import type { UserResultDTO } from "@/lib/search/types";

export default function SearchPage() {
  const [term, setTerm] = useState("");
  const { query, enabled } = useSearch(term);
  const data = query.data;

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2.5 rounded-full bg-surface-2 px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-fg-3" />
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Kişi, kullanıcı adı, etiket ara"
              className="flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-fg-3"
            />
            {term && (
              <button onClick={() => setTerm("")} aria-label="Temizle" className="shrink-0 text-fg-3 hover:text-fg">
                <X className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        </header>

        {!enabled ? (
          <div className="px-4 py-10">
            <EmptyState title="Aramaya başla" hint="Kişileri kullanıcı adı ya da isimle, gönderileri başlık ve etiketle bulabilirsin." />
          </div>
        ) : query.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="skeleton h-[46px] w-[46px] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-2.5 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <div className="px-4 py-6">
            <ErrorState onRetry={() => query.refetch()} />
          </div>
        ) : !data || (data.users.length === 0 && data.posts.length === 0) ? (
          <div className="px-4 py-10">
            <EmptyState title="Sonuç bulunamadı" hint="Farklı bir kelime ya da kullanıcı adı deneyebilirsin." />
          </div>
        ) : (
          <>
            {data.users.length > 0 && (
              <section>
                <h2 className="px-5 pb-1 pt-4 text-[12px] font-extrabold uppercase tracking-wider text-fg-3">Kişiler</h2>
                {data.users.map((u) => (
                  <UserRow key={u.id} u={u} />
                ))}
              </section>
            )}
            {data.posts.length > 0 && (
              <section>
                <h2 className="px-5 pb-1 pt-4 text-[12px] font-extrabold uppercase tracking-wider text-fg-3">Gönderiler</h2>
                <div className="grid grid-cols-3 gap-[3px] p-[3px]">
                  {data.posts.map((p) => (
                    <Link key={p.id} href={`/post/${p.id}`} className="relative aspect-square overflow-hidden bg-surface-2">
                      <Image src={p.media[0]?.url} alt={p.caption.slice(0, 60)} fill sizes="160px" className="object-cover transition-transform active:scale-105" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <div className="h-6" />
          </>
        )}
      </div>
    </AppShell>
  );
}

function UserRow({ u }: { u: UserResultDTO }) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-2.5">
      <Link href={`/profile/${u.username}`} className="shrink-0">
        <Avatar src={u.avatarUrl} size={46} />
      </Link>
      <Link href={`/profile/${u.username}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[14px] font-bold">
          <span className="truncate">{u.username}</span>
          {u.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </div>
        <div className="truncate text-[13px] text-fg-3">{u.name}</div>
      </Link>
      {!u.isMe && <FollowButton targetId={u.id} initiallyFollowing={u.followedByMe} />}
    </div>
  );
}

function FollowButton({ targetId, initiallyFollowing }: { targetId: string; initiallyFollowing: boolean }) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, startTransition] = useTransition();
  const toggle = () => {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const res = await toggleFollowAction(targetId, next);
      if (!res.ok) setFollowing(!next);
    });
  };
  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-[13px] font-bold disabled:opacity-50",
        following ? "bg-surface-2 text-fg" : "bg-primary text-white"
      )}
    >
      {following ? "Takip Ediliyor" : "Takip Et"}
    </button>
  );
}
