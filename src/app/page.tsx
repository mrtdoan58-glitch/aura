import { AppShell } from "@/components/layout/app-shell";
import { HomeClient } from "@/components/feed/home-client";
import { getCurrentUser } from "@/server/auth/current-user";
import { DEFAULT_AVATAR_URL } from "@/lib/feed/constants";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <AppShell>
      <HomeClient
        viewer={user ? { username: user.username, avatarUrl: user.avatarUrl ?? DEFAULT_AVATAR_URL } : null}
      />
    </AppShell>
  );
}
