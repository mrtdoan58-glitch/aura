/**
 * Üretim/dev seed — `npm run db:seed`. Prisma client gerektirir (`prisma generate`).
 * Boş bir feed yerine tanıdık bir demo deneyimi için birden çok yazar, gönderi ve
 * hikaye oluşturur (in-memory sürücünün `src/server/feed/seed.ts`'iyle aynı ruhta).
 */
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local" });
config();
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scryptSync } from "node:crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function hash(pw: string): string {
  const salt = randomBytes(16);
  const dk = scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("hex")}$${dk.toString("hex")}`;
}

const AUTHORS = [
  { name: "Elif Yıldız", username: "elifyildiz", email: "elif@aura.social" },
  { name: "Can Demir", username: "candemir", email: "can@aura.social" },
  { name: "Zeynep Ak", username: "zeynepak", email: "zeynep@aura.social" },
  { name: "Mert Kaya", username: "mertkaya", email: "mert@aura.social" },
  { name: "Selin Öz", username: "selinoz", email: "selin@aura.social" },
  { name: "Ada Çelik", username: "adacelik", email: "ada@aura.social" },
  { name: "Kerem Bulut", username: "kerembulut", email: "kerem@aura.social" },
  { name: "Nil Arda", username: "nilarda", email: "nil@aura.social" },
];

const CAPTIONS = [
  "Sabah ışığında sessiz bir köşe. Bazen en iyi kompozisyon hiçbir şey eklememektir.",
  "Yeni seri üzerinde çalışıyorum — minimalizm ve boşluğun gücü.",
  "Bugünün paleti: kum, kil ve gün batımı.",
  "Detaylarda kaybolmak. Doku her şeydir.",
  "Şehrin ritmi ile doğanın sessizliği arasında bir yerde.",
];
const TAGSETS = [["minimal", "tasarım", "ışık"], ["mimari", "boşluk"], ["fotoğraf", "analog", "doku"], ["sanat", "studio"]];
const IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=80",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=900&q=80",
  "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=900&q=80",
  "https://images.unsplash.com/photo-1507908708918-778587c9e563?w=900&q=80",
  "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=900&q=80",
  "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=900&q=80",
];
const LOCATIONS = ["İstanbul", "Berlin", "Tokyo", "Lizbon", "Oslo"];

async function main() {
  const admin = await prisma.user.upsert({
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
  console.log(`Admin hazır: ${admin.username}`);

  const authors = [];
  for (const a of AUTHORS) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        username: a.username,
        name: a.name,
        passwordHash: hash("Str0ngPass!"),
        emailVerified: new Date(),
        avatarUrl: `https://i.pravatar.cc/200?u=${a.username}`,
      },
    });
    authors.push(user);
  }

  let postCount = 0;
  for (let i = 0; i < authors.length; i++) {
    const author = authors[i];
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      const existing = await prisma.post.count({ where: { authorId: author.id, caption: CAPTIONS[idx % CAPTIONS.length] } });
      if (existing > 0) continue;
      await prisma.post.create({
        data: {
          authorId: author.id,
          caption: CAPTIONS[idx % CAPTIONS.length],
          tags: TAGSETS[idx % TAGSETS.length],
          location: LOCATIONS[idx % LOCATIONS.length],
          likeCount: 1200 + idx * 137,
          createdAt: new Date(Date.now() - idx * 37 * 60 * 1000),
          media: {
            create: [
              {
                type: "image",
                url: IMAGES[idx % IMAGES.length],
                width: 1080,
                height: 1350,
                order: 0,
              },
            ],
          },
        },
      });
      postCount++;
    }
  }
  console.log(`${postCount} yeni gönderi oluşturuldu.`);

  let storyCount = 0;
  const now = Date.now();
  for (let i = 0; i < authors.length; i++) {
    const author = authors[i];
    const existing = await prisma.story.count({
      where: { authorId: author.id, expiresAt: { gt: new Date() } },
    });
    if (existing > 0) continue;
    await prisma.story.create({
      data: {
        authorId: author.id,
        mediaUrl: IMAGES[i % IMAGES.length],
        type: "image",
        createdAt: new Date(now - i * 60 * 60 * 1000),
        expiresAt: new Date(now + (24 - i) * 60 * 60 * 1000),
      },
    });
    storyCount++;
  }
  console.log(`${storyCount} yeni hikaye oluşturuldu.`);

  console.log("Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
