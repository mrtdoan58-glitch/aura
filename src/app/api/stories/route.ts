import { NextResponse } from "next/server";
import { getFeedService } from "@/server/feed/container";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const stories = await getFeedService().getStories(user?.id ?? null);
  return NextResponse.json({ items: stories });
}
