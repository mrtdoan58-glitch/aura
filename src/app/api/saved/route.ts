import { NextResponse, type NextRequest } from "next/server";
import { getFeedService } from "@/server/feed/container";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [], nextCursor: null });
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 12);
  const collectionId = req.nextUrl.searchParams.get("collection") ?? undefined;
  const page = await getFeedService().getSaved({ cursor, limit, collectionId }, user.id);
  return NextResponse.json(page);
}
