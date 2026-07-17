import { describe, it, expect } from "vitest";
import { freshDb, seedUser, seedPost, cuid } from "./helpers";

describe("DB CRUD (real Postgres)", () => {
  it("creates, reads, updates and deletes a post", async () => {
    const db = await freshDb();
    const user = await seedUser(db);
    const { id } = await seedPost(db, user.id);
    // read
    let r = await db.query<{ caption: string }>(`SELECT caption FROM "Post" WHERE id=$1`, [id]);
    expect(r.rows[0].caption).toBe("caption");
    // update
    await db.query(`UPDATE "Post" SET caption=$1 WHERE id=$2`, ["updated", id]);
    r = await db.query(`SELECT caption FROM "Post" WHERE id=$1`, [id]);
    expect(r.rows[0].caption).toBe("updated");
    // delete
    await db.query(`DELETE FROM "Post" WHERE id=$1`, [id]);
    const c = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM "Post" WHERE id=$1`, [id]);
    expect(c.rows[0].n).toBe(0);
  });

  it("cascades delete from User to Post (FK ON DELETE CASCADE)", async () => {
    const db = await freshDb();
    const user = await seedUser(db);
    await seedPost(db, user.id);
    await db.query(`DELETE FROM "User" WHERE id=$1`, [user.id]);
    const c = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM "Post" WHERE "authorId"=$1`, [user.id]);
    expect(c.rows[0].n).toBe(0);
  });
});

describe("DB constraints (real Postgres)", () => {
  it("enforces unique email on User", async () => {
    const db = await freshDb();
    await seedUser(db, { email: "dup@aura.social", username: "a" });
    await expect(
      db.query(`INSERT INTO "User"("id","email","username","name","passwordHash") VALUES ($1,$2,$3,$4,$5)`, [
        cuid("u"), "dup@aura.social", "b", "X", "h",
      ])
    ).rejects.toThrow();
  });

  it("enforces unique (userId, postId) on Like (no double-like at DB level)", async () => {
    const db = await freshDb();
    const u = await seedUser(db);
    const p = await seedPost(db, u.id);
    await db.query(`INSERT INTO "Like"("id","userId","postId") VALUES ($1,$2,$3)`, [cuid("l"), u.id, p.id]);
    await expect(
      db.query(`INSERT INTO "Like"("id","userId","postId") VALUES ($1,$2,$3)`, [cuid("l"), u.id, p.id])
    ).rejects.toThrow();
  });

  it("rejects a Post with a non-existent author (FK constraint)", async () => {
    const db = await freshDb();
    await expect(
      db.query(`INSERT INTO "Post"("id","authorId","caption") VALUES ($1,$2,$3)`, [cuid("p"), "ghost", "x"])
    ).rejects.toThrow();
  });
});

describe("DB transactions (real Postgres)", () => {
  it("commits a like + counter increment atomically", async () => {
    const db = await freshDb();
    const u = await seedUser(db);
    const p = await seedPost(db, u.id);
    await db.transaction(async (tx) => {
      await tx.query(`INSERT INTO "Like"("id","userId","postId") VALUES ($1,$2,$3)`, [cuid("l"), u.id, p.id]);
      await tx.query(`UPDATE "Post" SET "likeCount"="likeCount"+1 WHERE id=$1`, [p.id]);
    });
    const r = await db.query<{ likeCount: number }>(`SELECT "likeCount" FROM "Post" WHERE id=$1`, [p.id]);
    expect(r.rows[0].likeCount).toBe(1);
  });

  it("rolls back the whole transaction on error (no partial writes)", async () => {
    const db = await freshDb();
    const u = await seedUser(db);
    const p = await seedPost(db, u.id);
    await expect(
      db.transaction(async (tx) => {
        await tx.query(`UPDATE "Post" SET "likeCount"="likeCount"+1 WHERE id=$1`, [p.id]);
        // ikinci ifade ihlal üretir (duplicate PK) → tüm işlem geri alınmalı
        await tx.query(`INSERT INTO "User"("id","email","username","name","passwordHash") VALUES ($1,$2,$3,$4,$5)`, [
          u.id, "x@x.co", "xx", "n", "h",
        ]);
      })
    ).rejects.toThrow();
    const r = await db.query<{ likeCount: number }>(`SELECT "likeCount" FROM "Post" WHERE id=$1`, [p.id]);
    expect(r.rows[0].likeCount).toBe(0); // rollback → sayaç artmadı
  });
});
