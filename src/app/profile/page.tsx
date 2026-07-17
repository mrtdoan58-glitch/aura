"use client";

import Image from "next/image";
import { useState } from "react";
import { BadgeCheck, Pencil, Share2, Settings, Grid3x3, Play, Bookmark, Heart, Layers } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { currentUser, profileGrid } from "@/lib/dummy-data";
import { formatCount, cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const TABS = [
  { key: "grid", icon: Grid3x3 },
  { key: "video", icon: Play },
  { key: "save", icon: Bookmark },
  { key: "like", icon: Heart },
];

export default function ProfilePage() {
  const [tab, setTab] = useState("grid");
  const showToast = useUIStore((s) => s.showToast);

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <div className="story-ring h-28 w-full" />
        <div className="relative -mt-11 px-5">
          <Image
            src={currentUser.avatar}
            alt={currentUser.name}
            width={92}
            height={92}
            className="h-[92px] w-[92px] rounded-[28px] border-4 border-bg object-cover shadow-md"
          />
          <div className="mt-3 flex items-center gap-1.5 text-[21px] font-extrabold tracking-tight">
            {currentUser.name}
            <BadgeCheck className="h-[18px] w-[18px] text-primary" />
          </div>
          <div className="text-[13.5px] font-medium text-fg-3">@{currentUser.username} · Görsel tasarımcı</div>
          <p className="mt-2.5 text-[13.5px] leading-relaxed">
            {currentUser.bio} <span className="font-semibold text-primary">aura.design/deniz</span>
          </p>

          <div className="my-4 flex gap-2">
            <Stat num={formatCount(currentUser.posts ?? 0)} label="Paylaşım" />
            <Stat num={formatCount(currentUser.followers ?? 0)} label="Takipçi" />
            <Stat num={formatCount(currentUser.following ?? 0)} label="Takip" />
          </div>

          <div className="mb-1 flex gap-2.5">
            <Button className="flex-1" onClick={() => showToast("Profil düzenle")}>
              <Pencil className="h-[17px] w-[17px]" /> Düzenle
            </Button>
            <Button variant="ghost" size="icon" className="!h-12 !w-12 !rounded-[16px]" onClick={() => showToast("Paylaş")}>
              <Share2 className="h-[17px] w-[17px]" />
            </Button>
            <Button variant="ghost" size="icon" className="!h-12 !w-12 !rounded-[16px]" onClick={() => showToast("Ayarlar")}>
              <Settings className="h-[17px] w-[17px]" />
            </Button>
          </div>
        </div>

        <div className="glass sticky top-0 z-20 mt-4 flex border-b border-border">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn("relative grid flex-1 place-items-center py-3.5", tab === key ? "text-fg" : "text-fg-3")}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
              {tab === key && <span className="absolute bottom-0 left-1/5 right-1/5 h-[2.5px] rounded bg-fg" />}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-[3px] p-[3px]">
          {profileGrid.map((img, i) => (
            <button key={i} onClick={() => showToast("Gönderi")} className="relative aspect-square overflow-hidden bg-surface-2">
              <Image src={img} alt="" fill className="object-cover transition-transform active:scale-105" sizes="160px" />
              {i % 4 === 0 && (
                <span className="absolute right-2 top-2 text-white drop-shadow">
                  <Layers className="h-[17px] w-[17px]" fill="white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex-1 rounded-[16px] border border-border bg-surface py-3 text-center">
      <div className="text-lg font-extrabold">{num}</div>
      <div className="mt-0.5 text-[11.5px] font-semibold text-fg-2">{label}</div>
    </div>
  );
}
