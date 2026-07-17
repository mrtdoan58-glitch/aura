/**
 * Üretim/dev seed — `npm run db:seed`. Prisma client gerektirir (`prisma generate`).
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hash(pw: string): string {
  const salt = randomBytes(16);
  const dk = scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("hex")}$${dk.toString("hex")}`;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "deniz@aura.social" },
    update: {},
    create: {
      email: "deniz@aura.social",
      username: "denizaksoy",
      name: "Deniz Aksoy",
      passwordHash: hash("Str0ngPass!"),
      emailVerified: new Date(),
      role: "ADMIN",
    },
  });

  for (let i = 0; i < 12; i++) {
    await prisma.post.create({
      data: {
        authorId: user.id,
        caption: `Seed gönderi #${i}`,
        tags: ["minimal", "tasarım"],
        location: "İstanbul",
        media: {
          create: [
            {
              type: "image",
              url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=80",
              width: 1080,
              height: 1350,
              order: 0,
            },
          ],
        },
      },
    });
  }
  console.log("Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
