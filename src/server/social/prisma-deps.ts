/**
 * Social üretim bağımlılıkları. `prisma generate` gerektirir; tsconfig `exclude`
 * ile typecheck dışında. `users`/`posts` için getAuthService()/getFeedService()
 * kullanılır — bunların Prisma'ya yapılandırılmış olması için instrumentation.ts'te
 * auth ve feed'den SONRA çağrılmalıdır.
 */
import type { SocialDeps } from "@/server/social/services/social-service";
import { PrismaFollowRepository } from "@/server/social/repositories/prisma";
import { getAuthService } from "@/server/auth/container";
import { getFeedService } from "@/server/feed/container";

export function buildPrismaSocialDeps(): SocialDeps {
  return {
    follows: new PrismaFollowRepository(),
    users: getAuthService(),
    posts: getFeedService(),
  };
}
