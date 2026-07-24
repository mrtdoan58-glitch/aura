import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/server/auth/current-user";
import { AppShell } from "@/components/layout/app-shell";
import { SavedCollections } from "@/components/feed/saved-collections";

export const metadata: Metadata = { title: "Kaydedilenler — Aura" };

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Link href="/profile" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Geri">
            <ArrowLeft className="h-[22px] w-[22px]" />
          </Link>
          <h1 className="text-[19px] font-extrabold tracking-tight">Kaydedilenler</h1>
        </header>
        <SavedCollections />
      </div>
    </AppShell>
  );
}
