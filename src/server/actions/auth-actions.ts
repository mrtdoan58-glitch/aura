"use server";

/**
 * Auth server action'ları — form state döndürür (progressive enhancement uyumlu).
 * CSRF: double-submit; Zod ile sunucu tarafı doğrulama; hatalar tek tip zarfta.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthService } from "@/server/auth/container";
import {
  setSessionCookie, clearSessionCookie, getSessionToken, getCsrfCookie,
} from "@/server/auth/cookies";
import { verifyCsrf } from "@/server/auth/csrf";
import { AuthError } from "@/server/auth/errors";
import {
  registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema,
} from "@/lib/validation/auth";

export interface ActionState {
  ok: boolean;
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60;

async function requestContext() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}

async function assertCsrf(formData: FormData): Promise<ActionState | null> {
  const cookieToken = await getCsrfCookie();
  const formToken = formData.get("csrf")?.toString();
  if (!verifyCsrf(cookieToken, formToken)) return { ok: false, error: "Güvenlik doğrulaması başarısız. Sayfayı yenileyin." };
  return null;
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const csrf = await assertCsrf(formData);
  if (csrf) return csrf;

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms") === "on" || formData.get("acceptTerms") === "true",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await getAuthService().register(parsed.data);
    return { ok: true, message: "Hesabın oluşturuldu. E-postana gönderilen bağlantıyla doğrula." };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const csrf = await assertCsrf(formData);
  if (csrf) return csrf;

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
    totp: formData.get("totp")?.toString() || undefined,
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const ctx = await requestContext();
    const result = await getAuthService().login(parsed.data, ctx);
    await setSessionCookie(result.refreshToken, parsed.data.rememberMe ? REMEMBER_MAX_AGE : SESSION_MAX_AGE);
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) await getAuthService().logout(token);
  await clearSessionCookie();
  redirect("/login");
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const csrf = await assertCsrf(formData);
  if (csrf) return csrf;
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  await getAuthService().requestPasswordReset(parsed.data.email);
  // Enumeration önleme: her durumda aynı yanıt
  return { ok: true, message: "Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi." };
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const csrf = await assertCsrf(formData);
  if (csrf) return csrf;
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await getAuthService().resetPassword(parsed.data.token, parsed.data.password);
    return { ok: true, message: "Şifren güncellendi. Artık giriş yapabilirsin." };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

export async function verifyEmailAction(token: string): Promise<ActionState> {
  const parsed = verifyEmailSchema.safeParse({ token });
  if (!parsed.success) return { ok: false, error: "Geçersiz bağlantı." };
  try {
    await getAuthService().verifyEmail(parsed.data.token);
    return { ok: true, message: "E-postan doğrulandı." };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}
