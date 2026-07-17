/**
 * Feed üretim bağımlılıkları — Prisma repoları.
 * `prisma generate` gerektirir; tsconfig `exclude` ile typecheck dışında.
 * Kullanım: dağıtım giriş noktasında `configureFeedDeps(buildPrismaFeedDeps())` çağrılır.
 */
import type { FeedDeps } from "@/server/feed/services/feed-service";
import { InMemoryRateLimiter } from "@/server/rate-limit/rate-limiter";
import {
  PrismaPostRepository, PrismaLikeRepository, PrismaSaveRepository,
  PrismaCommentRepository, PrismaStoryRepository,
} from "@/server/feed/repositories/prisma";

export function buildPrismaFeedDeps(): FeedDeps {
  return {
    posts: new PrismaPostRepository(),
    likes: new PrismaLikeRepository(),
    saves: new PrismaSaveRepository(),
    comments: new PrismaCommentRepository(),
    stories: new PrismaStoryRepository(),
    // TODO(prod): Redis sliding-window rate limiter ile değiştir.
    commentRateLimiter: new InMemoryRateLimiter(10, 60 * 1000),
  };
}
