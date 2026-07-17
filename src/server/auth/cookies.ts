/**
 * Oturum cookie yönetimi. Refresh token httpOnly + Secure + SameSite=Lax cookie'de tutulur.
 * CSRF token ise JS-erişilebilir (double-submit) cookie'de.
 */
import { cookies } from "next/headers";
import { generateCsrfToken } from "@/server/auth/csrf";
import { SESSION_COOKIE, CSRF_COOKIE, isSecureCookieContext } from "@/server/auth/cookie-names";

export async function setSessionCookie(refreshToken: string, maxAgeSeconds: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isSecureCookieContext(),
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, secure: isSecureCookieContext(), sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/**
 * CSRF cookie'sini okur. Cookie'nin kendisi middleware tarafından her istekte
 * garanti edilir (Server Component render'ı sırasında cookie set etmek Next.js'te
 * yasaktır). Middleware'in atlanabileceği teorik durumlar için, cookie'ye
 * yazmadan bir token döndüren savunmacı bir yedek içerir.
 */
export async function ensureCsrfToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  return generateCsrfToken();
}

export async function getCsrfCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value;
}
