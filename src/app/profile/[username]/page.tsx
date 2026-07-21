import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileHeader } from "@/components/social/profile-header";
import { ProfilePostsGrid } from "@/components/social/profile-posts-grid";
import { getSocialService, SocialError } from "@/server/social/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";
import type { ProfileDTO } from "@/lib/social/types";

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
        <div className="glass sticky top-0 z-20 mt-4 border-b border-border py-3 text-center text-[13px] font-bold text-fg-2">
          Gönderiler
        </div>
        <ProfilePostsGrid username={profile.username} />
      </div>
    </AppShell>
  );
}
