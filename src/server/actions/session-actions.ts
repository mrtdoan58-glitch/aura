"use server";

/** Cihaz oturumları yönetimi action'ları. */
import { revalidatePath } from "next/cache";
import { getAuthService } from "@/server/auth/container";
import { getCurrentUser } from "@/server/auth/current-user";
import { getSessionToken } from "@/server/auth/cookies";

export async function revokeSessionAction(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };
  await getAuthService().revokeSession(user.id, sessionId);
  revalidatePath("/settings/sessions");
  return { ok: true };
}

export async function revokeOtherSessionsAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };
  const token = await getSessionToken();
  if (!token) return { ok: false, error: "Oturum bulunamadı." };
  const current = await getAuthService().getValidSessionByToken(token);
  await getAuthService().revokeOtherSessions(user.id, current?.id ?? "");
  revalidatePath("/settings/sessions");
  return { ok: true };
}
