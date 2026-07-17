import type { Post, Story, Author, Media } from "@/server/feed/domain";

const NAMES = ["Elif Yıldız", "Can Demir", "Zeynep Ak", "Mert Kaya", "Selin Öz", "Ada Çelik", "Kerem Bulut", "Nil Arda"];
const USERNAMES = ["elifyildiz", "candemir", "zeynepak", "mertkaya", "selinoz", "adacelik", "kerembulut", "nilarda"];
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
const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMWY1ZjkiLz48L3N2Zz4=";

const author = (i: number): Author => ({
  id: `u${i % NAMES.length}`,
  name: NAMES[i % NAMES.length],
  username: USERNAMES[i % USERNAMES.length],
  avatarUrl: `https://i.pravatar.cc/200?img=${(i % 60) + 10}`,
  verified: i % 2 === 0,
});

function media(i: number, count: number): Media[] {
  return Array.from({ length: count }, (_, k) => ({
    id: `m${i}_${k}`,
    type: "image" as const,
    url: IMAGES[(i + k) % IMAGES.length],
    posterUrl: null,
    width: 1080,
    height: 1350,
    blurDataUrl: BLUR,
    order: k,
  }));
}

const BASE = new Date("2026-07-16T09:00:00Z").getTime();

export function seedPosts(count = 24): Post[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${String(i).padStart(3, "0")}`,
    author: author(i),
    media: media(i, (i % 3) + 1), // 1-3 görsel (carousel)
    caption: CAPTIONS[i % CAPTIONS.length],
    tags: TAGSETS[i % TAGSETS.length],
    location: LOCATIONS[i % LOCATIONS.length],
    likeCount: 1200 + i * 137,
    commentCount: 8 + (i % 40),
    createdAt: new Date(BASE - i * 37 * 60 * 1000), // azalan zaman
  }));
}

export function seedStories(): Story[] {
  const now = Date.now();
  return Array.from({ length: 8 }, (_, i) => ({
    id: `s${i}`,
    author: author(i),
    media: media(i, 1)[0],
    createdAt: new Date(now - i * 60 * 60 * 1000),
    expiresAt: new Date(now + (24 - i) * 60 * 60 * 1000),
    seenByMe: i > 4,
  }));
}
