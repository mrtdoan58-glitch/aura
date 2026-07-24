import { NextResponse, type NextRequest } from "next/server";
import { getFeedService } from "@/server/feed/container";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
  const replies = await getFeedService().listReplies(id, limit);
  return NextResponse.json({ items: replies });
}
