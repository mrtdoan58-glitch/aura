/**
 * Oturum cookie yönetimi. Refresh token httpOnly + Secure + SameSite=Lax cookie'de tutulur.
 * CSRF token ise JS-erişilebilir (double-submit) cookie'de.
 */
import { cookies } from "next/headers";
import { generateCsrfToken } from "@/server/auth/csrf";
import { SESSION_COOKIE, CSRF_COOKIE } from "@/server/auth/cookie-names";

const isProd = process.env.NODE_ENV === "production";

export async function setSessionCookie(refreshToken: string, maxAgeSeconds: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function ensureCsrfToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  const token = generateCsrfToken();
  store.set(CSRF_COOKIE, token, { httpOnly: false, secure: isProd, sameSite: "lax", path: "/" });
  return token;
}

export async function getCsrfCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value;
}
