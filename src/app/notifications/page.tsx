"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, ErrorState } from "@/components/feed/states";
import { useNotifications } from "@/hooks/use-notifications";
import { toggleFollowAction } from "@/server/actions/social-actions";
import { relativeTime } from "@/lib/feed/format";
import { cn } from "@/lib/utils";
import type { NotificationDTO } from "@/lib/notifications/types";

function notifText(n: NotificationDTO): string {
  switch (n.type) {
    case "FOLLOW":
      return "seni takip etmeye başladı.";
    case "LIKE":
      return "gönderini beğendi.";
    case "COMMENT":
      return n.commentText ? `yorum yaptı: "${n.commentText}"` : "gönderine yorum yaptı.";
  }
}

export default function NotificationsPage() {
  const { query, markAllRead } = useNotifications();
  const items = query.data?.items ?? [];

  const groups = [
    { label: "Yeni", data: items.filter((n) => !n.read) },
    { label: "Daha Önce", data: items.filter((n) => n.read) },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border px-5 py-3.5">
          <h1 className="text-[19px] font-extrabold tracking-tight">Bildirimler</h1>
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending || items.every((n) => n.read)}
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2 disabled:opacity-40"
            aria-label="Tümünü okundu işaretle"
          >
            <CheckCheck className="h-[22px] w-[22px]" />
          </button>
        </header>

        {query.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="skeleton h-[46px] w-[46px] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton h-2.5 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <div className="px-4 py-6">
            <ErrorState onRetry={() => query.refetch()} />
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState title="Henüz bildirim yok" hint="Biri seni takip ettiğinde, gönderini beğendiğinde ya da yorum yaptığında burada görünür." />
          </div>
        ) : (
          groups.map(
            (g) =>
              g.data.length > 0 && (
                <div key={g.label}>
                  <div className="px-5 pb-2 pt-4 text-[12px] font-extrabold uppercase tracking-wider text-fg-3">{g.label}</div>
                  {g.data.map((n) => (
                    <NotifRow key={n.id} n={n} />
                  ))}
                </div>
              )
          )
        )}
      </div>
    </AppShell>
  );
}

function NotifRow({ n }: { n: NotificationDTO }) {
  return (
    <div className={cn("relative flex items-center gap-3.5 px-5 py-3", !n.read && "bg-surface")}>
      {!n.read && <span className="absolute left-2 top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-primary" />}
      <Link href={`/profile/${n.actor.username}`} className="shrink-0">
        <Avatar src={n.actor.avatarUrl} size={46} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-snug">
          <Link href={`/profile/${n.actor.username}`} className="font-bold hover:underline">
            {n.actor.name}
          </Link>{" "}
          {notifText(n)}
        </p>
        <div className="mt-0.5 text-xs font-medium text-fg-3">{relativeTime(n.createdAt)}</div>
      </div>
      {n.type === "FOLLOW" ? (
        <FollowBackButton actorId={n.actor.id} initiallyFollowing={n.viewerFollowsActor} />
      ) : (
        n.postImageUrl && (
          <Image src={n.postImageUrl} alt="" width={44} height={44} className="h-11 w-11 rounded-[10px] object-cover" />
        )
      )}
    </div>
  );
}

function FollowBackButton({ actorId, initiallyFollowing }: { actorId: string; initiallyFollowing: boolean }) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, startTransition] = useTransition();
  const toggle = () => {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const res = await toggleFollowAction(actorId, next);
      if (!res.ok) setFollowing(!next);
    });
  };
  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "rounded-full px-4 py-2 text-[13px] font-bold disabled:opacity-50",
        following ? "bg-surface-2 text-fg" : "bg-primary text-white"
      )}
    >
      {following ? "Takip Ediliyor" : "Takip Et"}
    </button>
  );
}
