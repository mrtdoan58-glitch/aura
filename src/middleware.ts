import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, CSRF_COOKIE, isSecureCookieContext } from "@/server/auth/cookie-names";

/**
 * - Kimlik gerektiren rotaları korur (oturum cookie'si yoksa /login'e yönlendirir).
 * - Girişli kullanıcıyı auth sayfalarından ana sayfaya alır.
 * - Güvenlik başlıklarını her yanıta ekler.
 * - CSRF cookie'sini burada üretir: Server Component render'ı sırasında cookie
 *   set etmek Next.js'te yasak (throw eder), bu yüzden tek güvenli yer middleware.
 *   Edge runtime'da çalıştığından node:crypto yerine Web Crypto kullanılır.
 */
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/settings", "/create"];

function generateCsrfTokenEdge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const existingCsrf = req.cookies.get(CSRF_COOKIE)?.value;
  const csrfToken = existingCsrf ?? generateCsrfTokenEdge();

  let response: NextResponse;
  if (hasSession && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    response = NextResponse.redirect(new URL("/", req.url));
  } else if (!hasSession && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    response = NextResponse.redirect(url);
  } else if (!existingCsrf) {
    // Aynı istek içinde render edilecek Server Component'lerin de yeni token'ı
    // görebilmesi için istek başlığındaki Cookie'yi de güncelliyoruz.
    const requestHeaders = new Headers(req.headers);
    const cookieHeader = requestHeaders.get("cookie") ?? "";
    requestHeaders.set(
      "cookie",
      cookieHeader ? `${cookieHeader}; ${CSRF_COOKIE}=${csrfToken}` : `${CSRF_COOKIE}=${csrfToken}`
    );
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next();
  }

  if (!existingCsrf) {
    response.cookies.set(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      secure: isSecureCookieContext(),
      sameSite: "lax",
      path: "/",
    });
  }

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
