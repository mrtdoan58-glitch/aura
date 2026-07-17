/**
 * Feed kompozisyon kökü. Varsayılan in-memory (seed'li); üretimde `configureFeedDeps`
 * ile Prisma bağımlılıkları enjekte edilir (auth container ile aynı desen).
 */
import { FeedService, type FeedDeps } from "@/server/feed/services/feed-service";
import {
  InMemoryPostRepository, InMemoryLikeRepository, InMemorySaveRepository,
  InMemoryCommentRepository, InMemoryStoryRepository,
} from "@/server/feed/repositories/in-memory";
import { InMemoryRateLimiter } from "@/server/rate-limit/rate-limiter";

let injectedDeps: FeedDeps | null = null;
let cached: FeedService | null = null;

export function buildInMemoryFeedDeps(): FeedDeps {
  const posts = new InMemoryPostRepository();
  return {
    posts,
    likes: new InMemoryLikeRepository(),
    saves: new InMemorySaveRepository(posts),
    comments: new InMemoryCommentRepository(),
    stories: new InMemoryStoryRepository(),
    commentRateLimiter: new InMemoryRateLimiter(10, 60 * 1000),
  };
}

export function configureFeedDeps(deps: FeedDeps): void {
  injectedDeps = deps;
  cached = null;
}

export function getFeedService(): FeedService {
  if (!cached) cached = new FeedService(injectedDeps ?? buildInMemoryFeedDeps());
  return cached;
}
