/**
 * Messaging (DM) domain katmanı — birebir konuşmalar ve mesajlar.
 * Altyapıdan bağımsız (Dependency Inversion). Kullanıcı profili bilgisi için
 * ayrı bir depo tutmaz; servis katmanında UserDirectory ile çözülür (bkz. social).
 */
import type { CursorParams, CursorPage } from "@/server/feed/domain";

/** Bir mesajdaki emoji tepkisi özeti (emoji + sayı + izleyici tepki verdi mi). */
export interface ReactionSummary {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  imageUrl: string | null;
  reactions: ReactionSummary[];
  createdAt: Date;
}

/** Liste için konuşma özeti — diğer kullanıcı id'si + son mesaj + okunmamış sayısı. */
export interface ConversationSummary {
  id: string;
  otherUserId: string;
  lastMessageAt: Date;
  lastMessageText: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
}

/** İki kullanıcı id'sinden kanonik konuşma anahtarı (sıralı → tekil 1:1). */
export function conversationKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export interface ConversationRepository {
  findIdByKey(key: string): Promise<string | null>;
  /** Konuşmayı + iki katılımcıyı (lastReadAt=now) oluşturur, id döner. */
  create(key: string, userA: string, userB: string, now: Date): Promise<string>;
  /** Kullanıcının konuşmaları — lastMessageAt azalan; özet + unread hesaplı. */
  listForUser(userId: string): Promise<ConversationSummary[]>;
  isParticipant(conversationId: string, userId: string): Promise<boolean>;
  otherUserId(conversationId: string, userId: string): Promise<string | null>;
  /** Karşı katılımcının lastReadAt'i (okundu bilgisi için). */
  otherLastReadAt(conversationId: string, userId: string): Promise<Date | null>;
  /**
   * Yeni mesajı kaydet: lastMessageAt/önizleme'yi denormalize et ve KARŞI
   * katılımcıların okunmamış sayacını +1 yap (gönderen hariç).
   */
  recordMessage(conversationId: string, senderId: string, preview: string, at: Date): Promise<void>;
  /** Kullanıcının lastReadAt'ini güncelle ve okunmamış sayacını 0'a resetle. */
  markRead(conversationId: string, userId: string, at: Date): Promise<void>;
}

export interface MessageRepository {
  /** Mesajlar (createdAt DESC, id DESC) — istemci gösterirken ters çevirir. */
  list(conversationId: string, params: CursorParams): Promise<CursorPage<Message>>;
  create(data: { conversationId: string; senderId: string; text: string; imageUrl?: string | null; now: Date }): Promise<Message>;
  /** Mesajın ait olduğu konuşma id'si (reaksiyon yetkilendirmesi için); yoksa null. */
  conversationIdOf(messageId: string): Promise<string | null>;
}

export interface ReactionRepository {
  /** Kullanıcı başına mesaj başına tek tepki — upsert (emoji değiştirir). */
  set(messageId: string, userId: string, emoji: string): Promise<void>;
  remove(messageId: string, userId: string): Promise<void>;
  /** Toplu: verilen mesaj id'leri için tepki özetleri (N+1 yok). */
  listForMessages(messageIds: string[], viewerId: string | null): Promise<Record<string, ReactionSummary[]>>;
}
