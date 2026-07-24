/**
 * Messaging (DM) domain katmanı — birebir konuşmalar ve mesajlar.
 * Altyapıdan bağımsız (Dependency Inversion). Kullanıcı profili bilgisi için
 * ayrı bir depo tutmaz; servis katmanında UserDirectory ile çözülür (bkz. social).
 */
import type { CursorParams, CursorPage } from "@/server/feed/domain";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
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
  /** lastMessageAt güncelle (yeni mesajda). */
  touch(conversationId: string, at: Date): Promise<void>;
  /** Kullanıcının lastReadAt'ini güncelle. */
  markRead(conversationId: string, userId: string, at: Date): Promise<void>;
}

export interface MessageRepository {
  /** Mesajlar (createdAt DESC, id DESC) — istemci gösterirken ters çevirir. */
  list(conversationId: string, params: CursorParams): Promise<CursorPage<Message>>;
  create(data: { conversationId: string; senderId: string; text: string; now: Date }): Promise<Message>;
}
