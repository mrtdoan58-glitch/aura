import { NextResponse, type NextRequest } from "next/server";
import { getFeedService } from "@/server/feed/container";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 15);
  const user = await getCurrentUser();
  const page = await getFeedService().listComments(id, { cursor, limit }, user?.id ?? null);
  return NextResponse.json(page);
}
