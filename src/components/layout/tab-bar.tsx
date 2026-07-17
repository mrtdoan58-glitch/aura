"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", icon: Home, key: "home" },
  { href: "/explore", icon: Compass, key: "explore" },
  { href: "/create", icon: Plus, key: "create", primary: true },
  { href: "/notifications", icon: Bell, key: "notif" },
  { href: "/profile", icon: User, key: "profile" },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-[440px] items-center justify-around border-t border-border px-3.5 pb-6 pt-2.5 md:hidden">
      {tabs.map(({ href, icon: Icon, key, primary }) => {
        const active = pathname === href;
        if (primary)
          return (
            <Link
              key={key}
              href={href}
              className="story-ring -mt-1.5 grid h-[54px] w-[54px] place-items-center rounded-[18px] text-white shadow-[0_8px_22px_rgba(79,70,229,0.45)] transition-transform active:scale-90"
              aria-label="Oluştur"
            >
              <Plus className="h-7 w-7" strokeWidth={2.2} />
            </Link>
          );
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "grid h-[46px] w-[52px] place-items-center rounded-2xl transition-all active:scale-90",
              active ? "text-primary" : "text-fg-3"
            )}
            aria-label={key}
          >
            <Icon
              className="h-[26px] w-[26px]"
              strokeWidth={active ? 1.5 : 1.8}
              fill={active ? "currentColor" : "none"}
            />
          </Link>
        );
      })}
    </nav>
  );
}
