import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileHeader } from "@/components/social/profile-header";
import { ProfilePostsGrid } from "@/components/social/profile-posts-grid";
import { ProfileHighlights } from "@/components/social/profile-highlights";
import { getSocialService, SocialError } from "@/server/social/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";
import type { ProfileDTO } from "@/lib/social/types";

/** Paylaşılan profil bağlantıları için zengin önizleme (Open Graph / Twitter). */
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  try {
    const p = await getSocialService().getProfile(username, null);
    const title = `${p.name} (@${p.username})`;
    const description = `${p.name} — Aura'da ${p.postCount} paylaşım · ${p.followerCount} takipçi`;
    return {
      title,
      description,
      openGraph: { title, description, type: "profile", images: [p.avatarUrl] },
      twitter: { card: "summary", title, description, images: [p.avatarUrl] },
    };
  } catch {
    return { title: "Profil" };
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const viewer = await getCurrentUser();

  let profile: ProfileDTO;
  try {
    profile = await getSocialService().getProfile(username, viewer?.id ?? null);
  } catch (e) {
    if (e instanceof SocialError && e.code === "NOT_FOUND") notFound();
    throw e;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <div className="story-ring h-28 w-full" />
        <ProfileHeader profile={profile} />
        <ProfileHighlights
          author={{
            id: profile.id,
            name: profile.name,
            username: profile.username,
            avatarUrl: profile.avatarUrl,
            verified: profile.verified,
          }}
          isOwner={viewer?.id === profile.id}
        />
        <div className="glass sticky top-0 z-20 mt-4 border-b border-border py-3 text-center text-[13px] font-bold text-fg-2">
          Gönderiler
        </div>
        <ProfilePostsGrid username={profile.username} />
      </div>
    </AppShell>
  );
}
