import { NextResponse, type NextRequest } from "next/server";
import { getSocialService } from "@/server/social/container";
import { getFeedService } from "@/server/feed/container";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ users: [], posts: [] });

  const user = await getCurrentUser();
  const viewerId = user?.id ?? null;
  const [users, posts] = await Promise.all([
    getSocialService().searchUsers(q, viewerId, 10),
    getFeedService().searchPosts(q, viewerId, 18),
  ]);
  return NextResponse.json({ users, posts });
}
