import { NextResponse, type NextRequest } from "next/server";
import { getFeedService } from "@/server/feed/container";
import { getCurrentUser } from "@/server/auth/current-user";
import { getCached, setCached } from "@/server/cache/read-cache";
import type { CursorPageDTO, PostDTO } from "@/lib/feed/types";

export const dynamic = "force-dynamic";

const ANON_TTL = 15; // sn

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 8);
  const user = await getCurrentUser();

  // Anonim istekler kişiselleştirilmemiştir → URL-başına kısa TTL cache (DB'yi korur).
  if (!user) {
    const key = `rc:feed:${cursor ?? "0"}:${limit}`;
    const hit = await getCached<CursorPageDTO<PostDTO>>(key);
    if (hit) return NextResponse.json(hit);
    const page = await getFeedService().getFeed({ cursor, limit }, null);
    await setCached(key, page, ANON_TTL);
    return NextResponse.json(page);
  }

  const page = await getFeedService().getFeed({ cursor, limit }, user.id);
  return NextResponse.json(page);
}
