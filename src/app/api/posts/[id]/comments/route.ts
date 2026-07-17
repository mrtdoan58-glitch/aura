import { NextResponse, type NextRequest } from "next/server";
import { getFeedService } from "@/server/feed/container";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 15);
  const page = await getFeedService().listComments(id, { cursor, limit });
  return NextResponse.json(page);
}
