"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function PostDetailHeader() {
  const router = useRouter();
  return (
    <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-border px-3 py-3">
      <button
        onClick={() => router.back()}
        aria-label="Geri"
        className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2"
      >
        <ArrowLeft className="h-[22px] w-[22px]" />
      </button>
      <h1 className="text-[17px] font-extrabold tracking-tight">Gönderi</h1>
    </header>
  );
}
