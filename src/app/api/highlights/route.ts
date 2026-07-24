import { NextResponse } from "next/server";
import { getFeedService } from "@/server/feed/container";

export const dynamic = "force-dynamic";

/** Bir profilin vurguları (herkese açık). */
export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ highlights: [] });
  const highlights = await getFeedService().getHighlights(userId);
  return NextResponse.json({ highlights });
}
