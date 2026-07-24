import { NextResponse, type NextRequest } from "next/server";
import { getFeedService } from "@/server/feed/container";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 18);
  const user = await getCurrentUser();
  // Paylaşılan temel liste FeedService içinde cache'lenir (anon + girişli); kişiselleştirme taze.
  const page = await getFeedService().getExplore({ cursor, limit }, user?.id ?? null);
  return NextResponse.json(page);
}
