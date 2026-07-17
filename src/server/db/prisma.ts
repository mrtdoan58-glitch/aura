/**
 * Prisma client singleton (üretim). Bu dosya `@prisma/client` üretilmiş tipe bağımlıdır;
 * `prisma generate` çalıştırılan ortamlarda derlenir. Sandbox'ta engine indirilemediği
 * için tsconfig `exclude` ile typecheck dışında tutulur; CI'da `db:generate` sonrası dahil edilir.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
