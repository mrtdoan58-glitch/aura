import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TagGrid } from "@/components/feed/tag-grid";

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${decodeURIComponent(tag)} — Aura` };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const label = decodeURIComponent(tag);

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Link href="/explore" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Geri">
            <ArrowLeft className="h-[22px] w-[22px]" />
          </Link>
          <h1 className="text-[19px] font-extrabold tracking-tight">#{label}</h1>
        </header>
        <TagGrid tag={label} />
      </div>
    </AppShell>
  );
}
