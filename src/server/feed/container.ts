/**
 * Feed kompozisyon kökü. Varsayılan in-memory (seed'li); üretimde `configureFeedDeps`
 * ile Prisma bağımlılıkları enjekte edilir (auth container ile aynı desen).
 */
import { FeedService, type FeedDeps } from "@/server/feed/services/feed-service";
import {
  InMemoryPostRepository, InMemoryLikeRepository, InMemorySaveRepository,
  InMemoryCommentRepository, InMemoryStoryRepository, InMemoryCommentLikeRepository,
} from "@/server/feed/repositories/in-memory";
import { InMemoryRateLimiter } from "@/server/rate-limit/rate-limiter";

// bkz. server/auth/container.ts — Next.js Server Action ve Server Component chunk'ları
// bu dosyanın ayrı modül örneklerini yükleyebilir; gerçek bir singleton için
// globalThis kullanılır (aksi halde ör. bir Server Action ile eklenen yorum,
// bir Route Handler'ın gördüğü feed store'da hiç var olmaz).
const globalForFeedContainer = globalThis as unknown as {
  __auraFeedInjectedDeps?: FeedDeps | null;
  __auraFeedCached?: FeedService | null;
};

export function buildInMemoryFeedDeps(): FeedDeps {
  const posts = new InMemoryPostRepository();
  return {
    posts,
    likes: new InMemoryLikeRepository(),
    saves: new InMemorySaveRepository(posts),
    comments: new InMemoryCommentRepository(),
    commentLikes: new InMemoryCommentLikeRepository(),
    stories: new InMemoryStoryRepository(),
    commentRateLimiter: new InMemoryRateLimiter(10, 60 * 1000),
    postRateLimiter: new InMemoryRateLimiter(5, 60 * 60 * 1000),
    storyRateLimiter: new InMemoryRateLimiter(10, 60 * 60 * 1000),
  };
}

export function configureFeedDeps(deps: FeedDeps): void {
  globalForFeedContainer.__auraFeedInjectedDeps = deps;
  globalForFeedContainer.__auraFeedCached = null;
}

export function getFeedService(): FeedService {
  if (!globalForFeedContainer.__auraFeedCached) {
    globalForFeedContainer.__auraFeedCached = new FeedService(
      globalForFeedContainer.__auraFeedInjectedDeps ?? buildInMemoryFeedDeps()
    );
  }
  return globalForFeedContainer.__auraFeedCached;
}
