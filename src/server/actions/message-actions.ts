"use server";

/**
 * Messaging mutation action'ları. Kimlik doğrulama zorunlu; hata tek tip zarfta döner.
 * (Next Server Actions yerleşik origin/CSRF korumasına sahiptir.)
 */
import { getMessagingService, MessagingError } from "@/server/messaging/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";
import type { MessageDTO } from "@/lib/messaging/types";

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
    return { ok: true, data: { ...m, createdAt: m.createdAt.toISOString() } };
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
