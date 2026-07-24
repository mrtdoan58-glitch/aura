import { describe, it, expect } from "vitest";
import { freshDb } from "./helpers";

describe("DB migration (real Postgres via PGlite)", () => {
  it("applies the migration and creates all tables", async () => {
    const db = await freshDb();
    const res = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
    );
    const tables = res.rows.map((r) => r.table_name);
    for (const t of ["User", "Session", "Post", "Media", "Comment", "Like", "SavedPost", "Story", "StoryView", "Follow", "LoginAttempt", "Notification", "Conversation", "ConversationParticipant", "Message"]) {
      expect(tables).toContain(t);
    }
  });

  it("creates enum types", async () => {
    const db = await freshDb();
    const res = await db.query<{ typname: string }>(`SELECT typname FROM pg_type WHERE typname IN ('Role','MediaType','NotificationType')`);
    expect(res.rows.map((r) => r.typname).sort()).toEqual(["MediaType", "NotificationType", "Role"]);
  });

  it("creates expected indexes", async () => {
    const db = await freshDb();
    const res = await db.query<{ indexname: string }>(`SELECT indexname FROM pg_indexes WHERE schemaname='public'`);
    const idx = res.rows.map((r) => r.indexname);
    expect(idx).toContain("Post_createdAt_id_idx");
    expect(idx).toContain("Comment_postId_createdAt_id_idx");
  });
});
