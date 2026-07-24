"use server";

/**
 * Messaging mutation action'ları. Kimlik doğrulama zorunlu; hata tek tip zarfta döner.
 * (Next Server Actions yerleşik origin/CSRF korumasına sahiptir.)
 */
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { getMessagingService, MessagingError } from "@/server/messaging/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";
import { publishConversationUpdate } from "@/server/realtime/pusher";
import type { MessageDTO } from "@/lib/messaging/types";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

function fail(e: unknown): ActionResult<never> {
  if (e instanceof MessagingError) return { ok: false, error: e.message, code: e.code };
  // instanceof chunk sınırında kaçırabilir — koda göre de kontrol et.
  if (typeof e === "object" && e !== null && "code" in e && "message" in e) {
    return { ok: false, error: String((e as { message: unknown }).message), code: String((e as { code: unknown }).code) };
  }
  return { ok: false, error: "Beklenmeyen bir hata oluştu." };
}

export async function startConversationAction(username: string): Promise<ActionResult<{ conversationId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    const conversationId = await getMessagingService().getOrCreateConversationByUsername(user.id, username);
    return { ok: true, data: { conversationId } };
  } catch (e) {
    return fail(e);
  }
}

export async function sendMessageAction(conversationId: string, text: string): Promise<ActionResult<MessageDTO>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    const m = await getMessagingService().sendMessage(conversationId, user.id, text);
    await publishConversationUpdate(conversationId);
    return { ok: true, data: { ...m, createdAt: m.createdAt.toISOString() } };
  } catch (e) {
    return fail(e);
  }
}

export async function sendImageMessageAction(formData: FormData): Promise<ActionResult<MessageDTO>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };

  const conversationId = String(formData.get("conversationId") ?? "");
  const caption = String(formData.get("caption") ?? "");
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Bir fotoğraf seç.", code: "INVALID_INPUT" };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Yalnızca resim dosyaları desteklenir.", code: "INVALID_INPUT" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Dosya çok büyük (en fazla 10MB).", code: "INVALID_INPUT" };

  try {
    const blob = await put(`messages/${user.id}/${randomUUID()}-${file.name}`, file, { access: "public", addRandomSuffix: false });
    const m = await getMessagingService().sendImageMessage(conversationId, user.id, blob.url, caption);
    await publishConversationUpdate(conversationId);
    return { ok: true, data: { ...m, createdAt: m.createdAt.toISOString() } };
  } catch (e) {
    return fail(e);
  }
}

export async function reactToMessageAction(messageId: string, emoji: string | null): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    await getMessagingService().reactToMessage(messageId, user.id, emoji);
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

export async function markConversationReadAction(conversationId: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    await getMessagingService().markRead(conversationId, user.id);
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
