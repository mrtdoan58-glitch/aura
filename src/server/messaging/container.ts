/**
 * Messaging kompozisyon kökü. Varsayılan in-memory; üretimde `configureMessagingDeps`
 * ile Prisma bağımlılıkları enjekte edilir. globalThis singleton — Server Action / RSC
 * chunk ayrımına rağmen tek bir servis/örnek (aksi halde bir action'da yazılan mesaj
 * başka bir render'ın store'unda görünmez). `users` için mevcut AuthService yeniden kullanılır.
 */
import { MessagingService, type MessagingDeps } from "@/server/messaging/services/messaging-service";
import {
  InMemoryMessagingStore, InMemoryConversationRepository, InMemoryMessageRepository, InMemoryReactionRepository,
} from "@/server/messaging/repositories/in-memory";
import { getAuthService } from "@/server/auth/container";
import { InMemoryRateLimiter } from "@/server/rate-limit/rate-limiter";

const g = globalThis as unknown as {
  __auraMsgStore?: InMemoryMessagingStore;
  __auraMsgInjectedDeps?: MessagingDeps | null;
  __auraMsgCached?: MessagingService | null;
};

export function buildInMemoryMessagingDeps(): MessagingDeps {
  if (!g.__auraMsgStore) g.__auraMsgStore = new InMemoryMessagingStore();
  const store = g.__auraMsgStore;
  return {
    conversations: new InMemoryConversationRepository(store),
    messages: new InMemoryMessageRepository(store),
    reactions: new InMemoryReactionRepository(store),
    users: getAuthService(),
    messageRateLimiter: new InMemoryRateLimiter(30, 60 * 1000),
  };
}

export function configureMessagingDeps(deps: MessagingDeps): void {
  g.__auraMsgInjectedDeps = deps;
  g.__auraMsgCached = null;
}

export function getMessagingService(): MessagingService {
  if (!g.__auraMsgCached) {
    g.__auraMsgCached = new MessagingService(g.__auraMsgInjectedDeps ?? buildInMemoryMessagingDeps());
  }
  return g.__auraMsgCached;
}
