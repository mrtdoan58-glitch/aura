import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Lock, ShieldCheck, ChevronRight, Trash2 } from "lucide-react";
import { getCurrentUser } from "@/server/auth/current-user";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutButton } from "@/components/settings/logout-button";

export const metadata: Metadata = { title: "Ayarlar — Aura" };

const DEFAULT_AVATAR = "https://i.pravatar.cc/200?img=68";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-[560px] px-5 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Geri">
          <ArrowLeft className="h-[22px] w-[22px]" />
        </Link>
        <h1 className="text-[22px] font-extrabold tracking-tight">Ayarlar</h1>
      </header>

      <Link href={`/profile/${user.username}`} className="mb-6 flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2">
        <Avatar src={user.avatarUrl ?? DEFAULT_AVATAR} size={52} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold">{user.name}</div>
          <div className="truncate text-[13px] text-fg-3">@{user.username}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-fg-3" />
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border">
        <Row href="/settings/profile" icon={<User className="h-[19px] w-[19px]" />} label="Profili Düzenle" />
        <Row href="/settings/password" icon={<Lock className="h-[19px] w-[19px]" />} label="Şifre Değiştir" />
        <Row href="/settings/sessions" icon={<ShieldCheck className="h-[19px] w-[19px]" />} label="Güvenlik & Oturumlar" last />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-border px-4 py-3">
        <span className="text-[14px] font-semibold">Görünüm</span>
        <ThemeToggle />
      </div>

      <div className="mt-6">
        <LogoutButton />
      </div>

      <Link
        href="/settings/delete"
        className="mt-3 flex items-center gap-3.5 rounded-2xl px-4 py-3 text-danger transition-colors hover:bg-danger/5"
      >
        <Trash2 className="h-[18px] w-[18px]" />
        <span className="flex-1 text-[14px] font-semibold">Hesabı Sil</span>
        <ChevronRight className="h-5 w-5 opacity-60" />
      </Link>
    </div>
  );
}

function Row({ href, icon, label, last }: { href: string; icon: React.ReactNode; label: string; last?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-2 ${last ? "" : "border-b border-border"}`}
    >
      <span className="text-fg-2">{icon}</span>
      <span className="flex-1 text-[14.5px] font-semibold">{label}</span>
      <ChevronRight className="h-5 w-5 text-fg-3" />
    </Link>
  );
}
