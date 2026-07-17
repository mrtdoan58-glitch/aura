import { describe, it, expect } from "vitest";
import { encodeCursor, decodeCursor, isAfterCursor } from "@/server/feed/cursor";

describe("cursor encoding", () => {
  it("round-trips a cursor", () => {
    const d = new Date("2026-07-16T09:00:00Z");
    const c = encodeCursor(d, "p001");
    const decoded = decodeCursor(c);
    expect(decoded).toEqual({ createdAt: d.getTime(), id: "p001" });
  });

  it("returns null for empty/invalid cursors", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("!!!not-base64!!!===")).toBeNull();
  });

  it("orders items after the cursor (createdAt DESC, id DESC)", () => {
    const c = decodeCursor(encodeCursor(new Date(1000), "m"))!;
    expect(isAfterCursor(new Date(900), "z", c)).toBe(true); // daha eski → sonra
    expect(isAfterCursor(new Date(1100), "a", c)).toBe(false); // daha yeni → önce
    expect(isAfterCursor(new Date(1000), "a", c)).toBe(true); // eşit zaman, küçük id → sonra
    expect(isAfterCursor(new Date(1000), "z", c)).toBe(false);
  });
});
