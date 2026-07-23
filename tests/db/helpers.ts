import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Gerçek Postgres engine (WASM/PGlite) — sunucu/native gerektirmez, testlerde
 * TÜM migration'ları sırayla uygular. Yeni bir migration eklendiğinde SQL'i
 * burada (yani `npm run test`'te) doğrulanır — prod'a `migrate deploy` etmeden önce.
 */
export async function freshDb(): Promise<PGlite> {
  const db = new PGlite(); // bellek içi
  const migrationsDir = resolve(__dirname, "../../prisma/migrations");
  const dirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const dir of dirs) {
    const sql = readFileSync(resolve(migrationsDir, dir, "migration.sql"), "utf8");
    await db.exec(sql);
  }
  return db;
}

let counter = 0;
export function cuid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;
}

export async function seedUser(db: PGlite, over: Partial<{ email: string; username: string }> = {}) {
  const id = cuid("u");
  const email = over.email ?? `${id}@aura.social`;
  const username = over.username ?? id;
  await db.query(
    `INSERT INTO "User"("id","email","username","name","passwordHash") VALUES ($1,$2,$3,$4,$5)`,
    [id, email, username, "Test User", "scrypt$hash"]
  );
  return { id, email, username };
}

export async function seedPost(db: PGlite, authorId: string) {
  const id = cuid("p");
  await db.query(`INSERT INTO "Post"("id","authorId","caption") VALUES ($1,$2,$3)`, [id, authorId, "caption"]);
  return { id };
}
