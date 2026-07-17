"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { notifications as seed } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [items, setItems] = useState(seed);
  const markAll = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));

  const groups = [
    { label: "Yeni", data: items.filter((n) => n.unread) },
    { label: "Bu Hafta", data: items.filter((n) => !n.unread) },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border px-5 py-3.5">
          <h1 className="text-[19px] font-extrabold tracking-tight">Bildirimler</h1>
          <button onClick={markAll} className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Tümünü okundu işaretle">
            <CheckCheck className="h-[22px] w-[22px]" />
          </button>
        </header>

        {groups.map(
          (g) =>
            g.data.length > 0 && (
              <div key={g.label}>
                <div className="px-5 pb-2 pt-4 text-[12px] font-extrabold uppercase tracking-wider text-fg-3">
                  {g.label}
                </div>
                {g.data.map((n) => (
                  <NotifRow key={n.id} n={n} />
                ))}
              </div>
            )
        )}
      </div>
    </AppShell>
  );
}

function NotifRow({ n }: { n: (typeof seed)[number] }) {
  const [following, setFollowing] = useState(false);
  return (
    <div className={cn("relative flex items-center gap-3.5 px-5 py-3", n.unread && "bg-surface")}>
      {n.unread && <span className="absolute left-2 top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-primary" />}
      <Avatar src={n.user.avatar} size={46} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-snug">
          <b className="font-bold">{n.user.name}</b> {n.text}
        </p>
        <div className="mt-0.5 text-xs font-medium text-fg-3">{n.time}</div>
      </div>
      {n.type === "follow" ? (
        <button
          onClick={() => setFollowing((v) => !v)}
          className={cn(
            "rounded-full px-4 py-2 text-[13px] font-bold",
            following ? "bg-surface-2 text-fg" : "bg-primary text-white"
          )}
        >
          {following ? "Takip" : "Takip Et"}
        </button>
      ) : (
        n.thumb && (
          <Image src={n.thumb} alt="" width={44} height={44} className="h-11 w-11 rounded-[10px] object-cover" />
        )
      )}
    </div>
  );
}
