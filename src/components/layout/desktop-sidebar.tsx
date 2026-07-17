"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Home, Compass, Bell, Send, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", icon: Home, label: "Ana Sayfa" },
  { href: "/explore", icon: Compass, label: "Keşfet" },
  { href: "/notifications", icon: Bell, label: "Bildirimler" },
  { href: "/messages", icon: Send, label: "Mesajlar" },
  { href: "/profile", icon: User, label: "Profil" },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col gap-1 border-r border-border p-4 md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-2.5 py-4 text-[22px] font-extrabold tracking-tight">
        <span className="story-ring grid h-8 w-8 place-items-center rounded-[10px]">
          <Sparkles className="h-[18px] w-[18px] text-white" />
        </span>
        Aura
      </Link>
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-[15px] font-semibold transition-all hover:bg-surface",
              active ? "bg-surface-2 font-bold text-fg" : "text-fg-2"
            )}
          >
            <Icon className="h-[23px] w-[23px]" fill={active ? "currentColor" : "none"} strokeWidth={active ? 1.6 : 1.9} />
            {label}
          </Link>
        );
      })}
      <Link
        href="/create"
        className="mt-3.5 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14.5px] font-bold text-white shadow-[0_8px_20px_var(--ring)]"
      >
        <Plus className="h-[19px] w-[19px]" /> Oluştur
      </Link>
    </aside>
  );
}
