/**
 * Social kompozisyon kökü. Varsayılan in-memory; üretimde `configureSocialDeps`
 * ile Prisma bağımlılıkları enjekte edilir (auth/feed container'larıyla aynı desen).
 *
 * `users` ve `posts` için ayrı bir depo kurmak yerine, zaten var olan
 * AuthService/FeedService singleton'larını (getAuthService/getFeedService)
 * yeniden kullanır — bu sayede in-memory modda bile gerçek, paylaşılan veriye
 * bakar (ör. register ile oluşturulan kullanıcı, oluşturulan gönderiler).
 */
import { SocialService, type SocialDeps } from "@/server/social/services/social-service";
import { InMemoryFollowRepository } from "@/server/social/repositories/in-memory";
import { getAuthService } from "@/server/auth/container";
import { getFeedService } from "@/server/feed/container";

const globalForSocialContainer = globalThis as unknown as {
  __auraSocialInjectedDeps?: SocialDeps | null;
  __auraSocialCached?: SocialService | null;
  __auraSocialFollows?: InMemoryFollowRepository | null;
};

export function buildInMemorySocialDeps(): SocialDeps {
  // Follow ilişkileri de aynı sebeple (Server Action/RSC chunk ayrımı) globalThis'te
  // tutulur — aksi halde bir action'da eklenen takip, bir sonraki render'da kaybolur.
  if (!globalForSocialContainer.__auraSocialFollows) {
    globalForSocialContainer.__auraSocialFollows = new InMemoryFollowRepository();
  }
  return {
    follows: globalForSocialContainer.__auraSocialFollows,
    users: getAuthService(),
    posts: getFeedService(),
  };
}

export function configureSocialDeps(deps: SocialDeps): void {
  globalForSocialContainer.__auraSocialInjectedDeps = deps;
  globalForSocialContainer.__auraSocialCached = null;
}

export function getSocialService(): SocialService {
  if (!globalForSocialContainer.__auraSocialCached) {
    globalForSocialContainer.__auraSocialCached = new SocialService(
      globalForSocialContainer.__auraSocialInjectedDeps ?? buildInMemorySocialDeps()
    );
  }
  return globalForSocialContainer.__auraSocialCached;
}
