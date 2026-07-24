import type { MetadataRoute } from "next";
import { getFeedService } from "@/server/feed/container";

// Gerçek içeriği (gönderi/profil/etiket) crawler'lara aç. Runtime'da (Prisma) üretilir;
// build prerender'ında in-memory seed sızmasını önlemek için dynamic. Crawler'lar seyrek
// çektiğinden DB yükü ihmal edilebilir.
export const dynamic = "force-dynamic";

const MAX_PAGES = 20; // güvenlik sınırı: en fazla 20 sayfa × 30 = 600 gönderi
const PAGE_SIZE = 30;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const postUrls: MetadataRoute.Sitemap = [];
  const usernames = new Set<string>();
  const tags = new Set<string>();

  try {
    let cursor: string | null = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await getFeedService().getExplore({ cursor, limit: PAGE_SIZE }, null);
      for (const p of res.items) {
        postUrls.push({
          url: `${base}/post/${p.id}`,
          lastModified: p.createdAt,
          changeFrequency: "weekly",
          priority: 0.6,
        });
        usernames.add(p.author.username);
        for (const t of p.tags) tags.add(t.toLowerCase());
      }
      cursor = res.nextCursor;
      if (!cursor) break;
    }
  } catch {
    // DB erişilemezse yalnızca statik rotalarla dön (sitemap yine de geçerli).
    return staticRoutes;
  }

  const profileUrls: MetadataRoute.Sitemap = [...usernames].map((u) => ({
    url: `${base}/profile/${encodeURIComponent(u)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.5,
  }));
  const tagUrls: MetadataRoute.Sitemap = [...tags].map((t) => ({
    url: `${base}/tags/${encodeURIComponent(t)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...postUrls, ...profileUrls, ...tagUrls];
}
