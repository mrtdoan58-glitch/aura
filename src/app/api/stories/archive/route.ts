import { NextResponse } from "next/server";
import { getFeedService } from "@/server/feed/container";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

/** Kullanıcının kendi hikaye arşivi (süresi dolmuşlar dahil) — vurgu oluştururken seçilir. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] });
  const items = await getFeedService().getStoryArchive(user.id);
  return NextResponse.json({ items });
}
