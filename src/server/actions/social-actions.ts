"use server";

/**
 * Social mutation action'ları. Kimlik doğrulama zorunlu; hata tek tip zarfta döner.
 * (Next Server Actions yerleşik origin/CSRF korumasına sahiptir — bkz. feed-actions.ts.)
 */
import { getSocialService, SocialError } from "@/server/social/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export async function toggleFollowAction(
  targetUserId: string,
  follow: boolean
): Promise<ActionResult<{ following: boolean; followerCount: number }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    const res = await getSocialService().setFollow(user.id, targetUserId, follow);
    return { ok: true, data: res };
  } catch (e) {
    if (e instanceof SocialError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}
