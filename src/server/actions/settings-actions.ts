"use server";

/**
 * Ayarlar mutation action'ları — profil güncelleme ve şifre değiştirme.
 * Kimlik doğrulama zorunlu; hata tek tip zarfta döner.
 */
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAuthService } from "@/server/auth/container";
import { AuthError } from "@/server/auth/errors";
import { getCurrentUser } from "@/server/auth/current-user";
import { getSessionToken, clearSessionCookie } from "@/server/auth/cookies";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validation/auth";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

function fail(e: unknown): ActionResult<never> {
  if (e instanceof AuthError) return { ok: false, error: e.message, code: e.code };
  if (typeof e === "object" && e !== null && "code" in e && "message" in e) {
    return { ok: false, error: String((e as { message: unknown }).message), code: String((e as { code: unknown }).code) };
  }
  return { ok: false, error: "Beklenmeyen bir hata oluştu." };
}

export interface ProfileResult {
  name: string;
  username: string;
  avatarUrl: string | null;
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult<ProfileResult>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };

  const parsed = updateProfileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    username: String(formData.get("username") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz giriş.", code: "INVALID_INPUT" };
  }

  try {
    let avatarUrl: string | undefined;
    const file = formData.get("avatar");
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        return { ok: false, error: "Yalnızca resim dosyaları desteklenir.", code: "INVALID_INPUT" };
      }
      if (file.size > MAX_AVATAR_BYTES) {
        return { ok: false, error: "Fotoğraf çok büyük (en fazla 5MB).", code: "INVALID_INPUT" };
      }
      const blob = await put(`avatars/${user.id}/${randomUUID()}-${file.name}`, file, {
        access: "public",
        addRandomSuffix: false,
      });
      avatarUrl = blob.url;
    }

    const updated = await getAuthService().updateProfile(user.id, {
      name: parsed.data.name,
      username: parsed.data.username,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    });

    revalidatePath(`/profile/${updated.username}`);
    revalidatePath("/settings/profile");
    return { ok: true, data: { name: updated.name, username: updated.username, avatarUrl: updated.avatarUrl } };
  } catch (e) {
    return fail(e);
  }
}

export async function changePasswordAction(
  currentPassword: string,
  password: string,
  confirmPassword: string
): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };

  const parsed = changePasswordSchema.safeParse({ currentPassword, password, confirmPassword });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz giriş.", code: "INVALID_INPUT" };
  }

  try {
    await getAuthService().changePassword(user.id, parsed.data.currentPassword, parsed.data.password);
    // Güvenlik: şifre değişince diğer cihaz oturumlarını sonlandır (mevcut oturum kalır).
    const token = await getSessionToken();
    const current = token ? await getAuthService().getValidSessionByToken(token) : null;
    await getAuthService().revokeOtherSessions(user.id, current?.id ?? "");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAccountAction(password: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  if (!password) return { ok: false, error: "Şifre gerekli.", code: "INVALID_INPUT" };
  try {
    await getAuthService().deleteAccount(user.id, password);
    await clearSessionCookie(); // oturum çerezini temizle (DB oturumları cascade ile zaten gitti)
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
