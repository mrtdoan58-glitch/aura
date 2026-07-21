import { NextResponse, type NextRequest } from "next/server";
import { getFeedService } from "@/server/feed/container";
import { getAuthService } from "@/server/auth/container";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const author = await getAuthService().getUserByUsername(username);
  if (!author) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 12);
  const viewer = await getCurrentUser();
  const page = await getFeedService().getUserPosts(author.id, { cursor, limit }, viewer?.id ?? null);
  return NextResponse.json(page);
}
