/**
 * Feed üretim bağımlılıkları — Prisma repoları.
 * `prisma generate` gerektirir; tsconfig `exclude` ile typecheck dışında.
 * Kullanım: dağıtım giriş noktasında `configureFeedDeps(buildPrismaFeedDeps())` çağrılır.
 */
import type { FeedDeps } from "@/server/feed/services/feed-service";
import { InMemoryRateLimiter, type RateLimiter } from "@/server/rate-limit/rate-limiter";
import { RedisRateLimiter } from "@/server/rate-limit/redis-rate-limiter";
import { getEnv } from "@/lib/env";
import { Redis } from "@upstash/redis";
import {
  PrismaPostRepository, PrismaLikeRepository, PrismaSaveRepository,
  PrismaCommentRepository, PrismaStoryRepository,
} from "@/server/feed/repositories/prisma";

function buildCommentRateLimiter(): RateLimiter {
  const env = getEnv();
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    const redis = new Redis({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN });
    return new RedisRateLimiter(redis, 10, 60 * 1000);
  }
  return new InMemoryRateLimiter(10, 60 * 1000);
}

export function buildPrismaFeedDeps(): FeedDeps {
  return {
    posts: new PrismaPostRepository(),
    likes: new PrismaLikeRepository(),
    saves: new PrismaSaveRepository(),
    comments: new PrismaCommentRepository(),
    stories: new PrismaStoryRepository(),
    commentRateLimiter: buildCommentRateLimiter(),
  };
}
