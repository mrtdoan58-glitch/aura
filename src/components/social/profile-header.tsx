"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { BadgeCheck, UserPlus, UserCheck, Pencil, Share2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFollowAction } from "@/server/actions/social-actions";
import { useUIStore } from "@/store/ui-store";
import { formatCount } from "@/lib/utils";
import type { ProfileDTO } from "@/lib/social/types";

export function ProfileHeader({ profile }: { profile: ProfileDTO }) {
  const [following, setFollowing] = useState(profile.followedByMe);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [pending, startTransition] = useTransition();
  const showToast = useUIStore((s) => s.showToast);

  const toggleFollow = () => {
    const next = !following;
    setFollowing(next);
    setFollowerCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleFollowAction(profile.id, next);
      if (res.ok && res.data) {
        setFollowing(res.data.following);
        setFollowerCount(res.data.followerCount);
      } else if (!res.ok) {
        setFollowing(!next);
        setFollowerCount((c) => c + (next ? -1 : 1));
        showToast(res.error ?? "Bir şeyler ters gitti");
      }
    });
  };

  return (
    <div className="relative -mt-11 px-5">
      <Image
        src={profile.avatarUrl}
        alt={profile.name}
        width={92}
        height={92}
        className="h-[92px] w-[92px] rounded-[28px] border-4 border-bg object-cover shadow-md"
      />
      <div className="mt-3 flex items-center gap-1.5 text-[21px] font-extrabold tracking-tight">
        {profile.name}
        {profile.verified && <BadgeCheck className="h-[18px] w-[18px] text-primary" />}
      </div>
      <div className="text-[13.5px] font-medium text-fg-3">@{profile.username}</div>

      <div className="my-4 flex gap-2">
        <Stat num={formatCount(profile.postCount)} label="Paylaşım" />
        <Stat num={formatCount(followerCount)} label="Takipçi" />
        <Stat num={formatCount(profile.followingCount)} label="Takip" />
      </div>

      <div className="mb-1 flex gap-2.5">
        {profile.isMe ? (
          <>
            <Button className="flex-1" onClick={() => showToast("Profil düzenle")}>
              <Pencil className="h-[17px] w-[17px]" /> Düzenle
            </Button>
            <Button variant="ghost" size="icon" className="!h-12 !w-12 !rounded-[16px]" onClick={() => showToast("Paylaş")}>
              <Share2 className="h-[17px] w-[17px]" />
            </Button>
            <Button variant="ghost" size="icon" className="!h-12 !w-12 !rounded-[16px]" onClick={() => showToast("Ayarlar")}>
              <Settings className="h-[17px] w-[17px]" />
            </Button>
          </>
        ) : (
          <Button
            variant={following ? "outline" : "primary"}
            className="flex-1"
            disabled={pending}
            onClick={toggleFollow}
          >
            {following ? <UserCheck className="h-[17px] w-[17px]" /> : <UserPlus className="h-[17px] w-[17px]" />}
            {following ? "Takip Ediliyor" : "Takip Et"}
          </Button>
        )}
      </div>
    </div>
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
