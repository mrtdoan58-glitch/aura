/**
 * CSRF — double-submit cookie deseni.
 * Sunucu rastgele bir token üretir, hem httpOnly olmayan cookie'ye hem de
 * formun gizli alanına konur; sunucu ikisinin eşleştiğini sabit-zamanda doğrular.
 */
import { randomBytes, timingSafeEqual } from "node:crypto";
import { CSRF_COOKIE } from "@/server/auth/cookie-names";

export { CSRF_COOKIE };

export function generateCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

export function verifyCsrf(cookieToken: string | undefined, formToken: string | undefined): boolean {
  if (!cookieToken || !formToken) return false;
  const a = Buffer.from(cookieToken);
  const b = Buffer.from(formToken);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
