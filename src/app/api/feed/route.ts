import { NextResponse, type NextRequest } from "next/server";
import { getFeedService } from "@/server/feed/container";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 8);
  const user = await getCurrentUser();
  const page = await getFeedService().getFeed({ cursor, limit }, user?.id ?? null);
  return NextResponse.json(page);
}
