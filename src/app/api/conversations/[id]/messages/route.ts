import { NextResponse, type NextRequest } from "next/server";
import { getMessagingService, MessagingError } from "@/server/messaging/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 40);
  try {
    const thread = await getMessagingService().getThread(id, user.id, { cursor, limit });
    return NextResponse.json(thread);
  } catch (e) {
    const code = e instanceof MessagingError ? e.code : undefined;
    if (code === "FORBIDDEN") return NextResponse.json({ error: "Erişim yok." }, { status: 403 });
    if (code === "NOT_FOUND") return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
    throw e;
  }
}
