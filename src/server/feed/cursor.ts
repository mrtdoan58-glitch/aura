/**
 * Opak cursor kodlama. Bileşik anahtar: `createdAt(ms)_id`.
 * Base64url ile taşınır; istemci içeriğini yorumlamamalı.
 */
export interface DecodedCursor {
  createdAt: number;
  id: string;
}

export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.getTime()}_${id}`).toString("base64url");
}

export function decodeCursor(cursor: string | null | undefined): DecodedCursor | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const idx = raw.indexOf("_");
    if (idx === -1) return null;
    const createdAt = Number(raw.slice(0, idx));
    const id = raw.slice(idx + 1);
    if (!Number.isFinite(createdAt) || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

/**
 * Bir öğe cursor'dan (createdAt DESC, id DESC sıralı) sonra mı gelir?
 * Aynı createdAt için id ile tie-break — sabit, kararlı sıralama sağlar.
 */
export function isAfterCursor(createdAt: Date, id: string, c: DecodedCursor): boolean {
  const t = createdAt.getTime();
  if (t !== c.createdAt) return t < c.createdAt;
  return id < c.id;
}
