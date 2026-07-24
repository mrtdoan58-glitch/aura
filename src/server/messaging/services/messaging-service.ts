/**
 * MessagingService — birebir DM iş kuralları. Bağımlılıklar arayüzle enjekte edilir
 * (Prisma olmadan test edilebilir). Yetki: bir kullanıcı yalnızca katılımcısı olduğu
 * konuşmayı okuyabilir/ona yazabilir.
 */
import {
  conversationKey,
  type ConversationRepository,
  type MessageRepository,
  type ReactionRepository,
  type Message,
} from "@/server/messaging/domain";
import type { User } from "@/server/auth/domain";
import type { RateLimiter } from "@/server/rate-limit/rate-limiter";

const DEFAULT_AVATAR = "https://i.pravatar.cc/200?img=68";
const MAX_TEXT_LEN = 2000;

export interface UserInfo {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
}

/** Kullanıcı bilgisini çözmek için — mevcut AuthService singleton'ı yeniden kullanılır. */
export interface UserDirectory {
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
}

export interface MessagingDeps {
  conversations: ConversationRepository;
  messages: MessageRepository;
  reactions: ReactionRepository;
  users: UserDirectory;
  messageRateLimiter?: RateLimiter;
  now?: () => Date;
}

/** DM mesajlarında izin verilen tepki emojileri. */
export const ALLOWED_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

export interface ConversationView {
  id: string;
  otherUser: UserInfo;
  lastMessageText: string | null;
  lastMessageAt: Date;
  lastMessageMine: boolean;
  unreadCount: number;
}

export interface ThreadView {
  id: string;
  otherUser: UserInfo;
  messages: Message[]; // createdAt DESC (istemci ters çevirir)
  nextCursor: string | null;
  otherLastReadAt: Date | null; // karşı taraf buraya kadar okudu (okundu bilgisi)
}

export class MessagingError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "INVALID_INPUT" | "UNAUTHENTICATED" | "FORBIDDEN" | "RATE_LIMITED",
    message: string
  ) {
    super(message);
    this.name = "MessagingError";
  }
}

function toUserInfo(u: User): UserInfo {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    avatarUrl: u.avatarUrl ?? DEFAULT_AVATAR,
    verified: u.role !== "USER",
  };
}

export class MessagingService {
  private now: () => Date;
  constructor(private readonly deps: MessagingDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  async listConversations(userId: string): Promise<ConversationView[]> {
    if (!userId) throw new MessagingError("UNAUTHENTICATED", "Giriş gerekli.");
    const summaries = await this.deps.conversations.listForUser(userId);
    const views = await Promise.all(
      summaries.map(async (s): Promise<ConversationView | null> => {
        const other = await this.deps.users.getUserById(s.otherUserId);
        if (!other) return null; // hesap silinmişse konuşmayı gizle
        return {
          id: s.id,
          otherUser: toUserInfo(other),
          lastMessageText: s.lastMessageText,
          lastMessageAt: s.lastMessageAt,
          lastMessageMine: s.lastMessageSenderId === userId,
          unreadCount: s.unreadCount,
        };
      })
    );
    return views.filter((v): v is ConversationView => v !== null);
  }

  /** Diğer kullanıcıyla konuşmayı bulur ya da oluşturur; konuşma id'sini döner. */
  async getOrCreateConversation(userId: string, otherUserId: string): Promise<string> {
    if (!userId) throw new MessagingError("UNAUTHENTICATED", "Giriş gerekli.");
    if (!otherUserId || otherUserId === userId)
      throw new MessagingError("INVALID_INPUT", "Kendine mesaj gönderemezsin.");
    const other = await this.deps.users.getUserById(otherUserId);
    if (!other) throw new MessagingError("NOT_FOUND", "Kullanıcı bulunamadı.");
    const key = conversationKey(userId, otherUserId);
    const existing = await this.deps.conversations.findIdByKey(key);
    if (existing) return existing;
    return this.deps.conversations.create(key, userId, otherUserId, this.now());
  }

  /** Kullanıcı adıyla konuşma başlat/bul — action katmanı için pratik sarmalayıcı. */
  async getOrCreateConversationByUsername(userId: string, username: string): Promise<string> {
    const other = await this.deps.users.getUserByUsername(username);
    if (!other) throw new MessagingError("NOT_FOUND", "Kullanıcı bulunamadı.");
    return this.getOrCreateConversation(userId, other.id);
  }

  async getThread(
    conversationId: string,
    userId: string,
    params: { cursor?: string | null; limit?: number }
  ): Promise<ThreadView> {
    if (!userId) throw new MessagingError("UNAUTHENTICATED", "Giriş gerekli.");
    if (!(await this.deps.conversations.isParticipant(conversationId, userId)))
      throw new MessagingError("FORBIDDEN", "Bu konuşmaya erişimin yok.");
    const otherId = await this.deps.conversations.otherUserId(conversationId, userId);
    const other = otherId ? await this.deps.users.getUserById(otherId) : null;
    if (!other) throw new MessagingError("NOT_FOUND", "Konuşma bulunamadı.");
    const page = await this.deps.messages.list(conversationId, {
      cursor: params.cursor,
      limit: Math.min(Math.max(params.limit ?? 40, 1), 50),
    });
    // Karşı tarafın okuma durumu (viewer'ın kendi markRead'inden etkilenmez).
    const otherLastReadAt = await this.deps.conversations.otherLastReadAt(conversationId, userId);
    // Tepkileri toplu çek (tek sorgu, N+1 yok) ve mesajlara ekle.
    const reactionMap = await this.deps.reactions.listForMessages(page.items.map((m) => m.id), userId);
    const messages = page.items.map((m) => ({ ...m, reactions: reactionMap[m.id] ?? [] }));
    // Konuşmayı açmak = okumak: okundu işaretle.
    await this.deps.conversations.markRead(conversationId, userId, this.now());
    return { id: conversationId, otherUser: toUserInfo(other), messages, nextCursor: page.nextCursor, otherLastReadAt };
  }

  async sendMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
    const trimmed = text.trim();
    if (!trimmed) throw new MessagingError("INVALID_INPUT", "Mesaj boş olamaz.");
    if (trimmed.length > MAX_TEXT_LEN) throw new MessagingError("INVALID_INPUT", "Mesaj çok uzun.");
    return this.deliver(conversationId, senderId, trimmed, null);
  }

  async sendImageMessage(conversationId: string, senderId: string, imageUrl: string, caption = ""): Promise<Message> {
    if (!imageUrl) throw new MessagingError("INVALID_INPUT", "Geçersiz görsel.");
    const trimmed = caption.trim();
    if (trimmed.length > MAX_TEXT_LEN) throw new MessagingError("INVALID_INPUT", "Açıklama çok uzun.");
    return this.deliver(conversationId, senderId, trimmed, imageUrl);
  }

  /** Ortak teslim: yetki + rate-limit + oluştur + konuşmayı güncelle + gönderen okundu. */
  private async deliver(conversationId: string, senderId: string, text: string, imageUrl: string | null): Promise<Message> {
    if (!senderId) throw new MessagingError("UNAUTHENTICATED", "Giriş gerekli.");
    if (!(await this.deps.conversations.isParticipant(conversationId, senderId)))
      throw new MessagingError("FORBIDDEN", "Bu konuşmaya yazamazsın.");
    if (this.deps.messageRateLimiter) {
      const rl = await this.deps.messageRateLimiter.consume(`msg:${senderId}`);
      if (!rl.allowed) throw new MessagingError("RATE_LIMITED", "Çok hızlı mesaj gönderiyorsun. Biraz bekle.");
    }
    const now = this.now();
    const message = await this.deps.messages.create({ conversationId, senderId, text, imageUrl, now });
    const preview = text || (imageUrl ? "📷 Fotoğraf" : "");
    await this.deps.conversations.recordMessage(conversationId, senderId, preview, now);
    await this.deps.conversations.markRead(conversationId, senderId, now); // gönderen okumuş sayılır (unread 0)
    return message;
  }

  /** Bir mesaja emoji tepkisi ekle/değiştir (emoji) ya da kaldır (null). */
  async reactToMessage(messageId: string, userId: string, emoji: string | null): Promise<void> {
    if (!userId) throw new MessagingError("UNAUTHENTICATED", "Giriş gerekli.");
    const conversationId = await this.deps.messages.conversationIdOf(messageId);
    if (!conversationId) throw new MessagingError("NOT_FOUND", "Mesaj bulunamadı.");
    if (!(await this.deps.conversations.isParticipant(conversationId, userId)))
      throw new MessagingError("FORBIDDEN", "Bu mesaja tepki veremezsin.");
    if (emoji === null) {
      await this.deps.reactions.remove(messageId, userId);
      return;
    }
    if (!ALLOWED_REACTIONS.includes(emoji)) throw new MessagingError("INVALID_INPUT", "Geçersiz tepki.");
    await this.deps.reactions.set(messageId, userId, emoji);
  }

  /** Konuşmayı okundu işaretle (istemci thread'i açtığında/odakladığında). */
  async markRead(conversationId: string, userId: string): Promise<void> {
    if (!userId) return;
    if (!(await this.deps.conversations.isParticipant(conversationId, userId))) return;
    await this.deps.conversations.markRead(conversationId, userId, this.now());
  }
}
