"use client";

import Image from "next/image";
import { useState } from "react";
import { Search, Heart } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EXPLORE_IMAGES } from "@/lib/dummy-data";
import { useUIStore } from "@/store/ui-store";
import { formatCount, cn } from "@/lib/utils";

const CHIPS = ["Tümü", "Tasarım", "Fotoğraf", "Mimari", "Seyahat", "Sanat", "Doğa", "Moda"];
const HEIGHTS = [210, 150, 240, 180, 200, 160, 230, 170, 190, 220];

export default function ExplorePage() {
  const [chip, setChip] = useState("Tümü");
  const showToast = useUIStore((s) => s.showToast);
  const tiles = [...EXPLORE_IMAGES, ...EXPLORE_IMAGES];

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 border-b border-border px-5 py-3.5">
          <h1 className="text-[19px] font-extrabold tracking-tight">Keşfet</h1>
        </header>
        <div className="mx-4 mt-3.5 flex items-center gap-2.5 rounded-full bg-surface-2 px-4 py-3">
          <Search className="h-5 w-5 text-fg-3" />
          <input
            placeholder="Kişi, etiket, konu ara"
            className="flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-fg-3"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => setChip(c)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all active:scale-95",
                chip === c ? "bg-fg text-bg" : "bg-surface-2 text-fg-2"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="columns-2 gap-2.5 px-4 pb-4 [column-gap:10px]">
          {tiles.map((img, i) => (
            <button
              key={i}
              onClick={() => showToast("Gönderi açılıyor")}
              className="group relative mb-2.5 block w-full overflow-hidden rounded-2xl bg-surface-2"
            >
              <Image
                src={img}
                alt=""
                width={250}
                height={HEIGHTS[i % HEIGHTS.length]}
                style={{ height: HEIGHTS[i % HEIGHTS.length] }}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
                  <Heart className="h-4 w-4" fill="white" /> {formatCount(400 + i * 211)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
