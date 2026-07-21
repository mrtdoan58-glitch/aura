/**
 * Prisma client singleton (üretim). Bu dosya `src/generated/prisma` üretilmiş çıktısına
 * bağımlıdır; `prisma generate` çalıştırılan ortamlarda derlenir. Sandbox'ta engine
 * indirilemediği için tsconfig `exclude` ile typecheck dışında tutulur; CI'da
 * `db:generate` sonrası dahil edilir.
 *
 * Prisma 7, PrismaClient()'ın bir driver adapter (veya accelerateUrl) ile
 * çağrılmasını zorunlu kılıyor — düz bir DATABASE_URL artık yeterli değil.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
