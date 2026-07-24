/**
 * Messaging üretim bağımlılıkları — Prisma repoları. `prisma generate` gerektirir;
 * tsconfig `exclude`. `users` için getAuthService() kullanılır (auth'tan SONRA yapılandırılmalı).
 */
import type { MessagingDeps } from "@/server/messaging/services/messaging-service";
import { InMemoryRateLimiter, type RateLimiter } from "@/server/rate-limit/rate-limiter";
import { RedisRateLimiter } from "@/server/rate-limit/redis-rate-limiter";
import { getEnv } from "@/lib/env";
import { Redis } from "@upstash/redis";
import { PrismaConversationRepository, PrismaMessageRepository } from "@/server/messaging/repositories/prisma";
import { getAuthService } from "@/server/auth/container";

function buildMessageRateLimiter(): RateLimiter {
  const env = getEnv();
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    const redis = new Redis({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN });
    return new RedisRateLimiter(redis, 30, 60 * 1000);
  }
  return new InMemoryRateLimiter(30, 60 * 1000);
}

export function buildPrismaMessagingDeps(): MessagingDeps {
  return {
    conversations: new PrismaConversationRepository(),
    messages: new PrismaMessageRepository(),
    users: getAuthService(),
    messageRateLimiter: buildMessageRateLimiter(),
  };
}
