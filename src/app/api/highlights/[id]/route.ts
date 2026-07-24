import { NextResponse } from "next/server";
import { getFeedService } from "@/server/feed/container";
import type { HighlightItemDTO } from "@/lib/feed/types";

export const dynamic = "force-dynamic";

/** Vurgu öğeleri (herkese açık) — izleyici bunları hikaye görüntüleyicide açar. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const h = await getFeedService().getHighlight(id);
    const items: HighlightItemDTO[] = h.items.map((it) => ({ id: it.id, url: it.media.url, type: it.media.type }));
    return NextResponse.json({ id: h.id, title: h.title, items });
  } catch {
    return NextResponse.json({ error: "Vurgu bulunamadı." }, { status: 404 });
  }
}
