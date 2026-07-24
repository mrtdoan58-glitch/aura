import { NextResponse, type NextRequest } from "next/server";
import { getFeedService } from "@/server/feed/container";
import { getCurrentUser } from "@/server/auth/current-user";
import { getCached, setCached } from "@/server/cache/read-cache";
import type { CursorPageDTO, PostDTO } from "@/lib/feed/types";

export const dynamic = "force-dynamic";

const ANON_TTL = 15; // sn — kısa; yeni gönderi/sayaç hızla görünür

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 18);
  const user = await getCurrentUser();

  // Anonim istekler kişiselleştirilmemiştir → URL-başına kısa TTL cache (DB'yi korur).
  if (!user) {
    const key = `rc:explore:${cursor ?? "0"}:${limit}`;
    const hit = await getCached<CursorPageDTO<PostDTO>>(key);
    if (hit) return NextResponse.json(hit, { headers: { "x-cache": "HIT" } });
    const page = await getFeedService().getExplore({ cursor, limit }, null);
    await setCached(key, page, ANON_TTL);
    return NextResponse.json(page, { headers: { "x-cache": "MISS" } });
  }

  const page = await getFeedService().getExplore({ cursor, limit }, user.id);
  return NextResponse.json(page);
}
