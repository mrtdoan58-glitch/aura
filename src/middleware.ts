import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/auth/cookie-names";

/**
 * - Kimlik gerektiren rotaları korur (oturum cookie'si yoksa /login'e yönlendirir).
 * - Girişli kullanıcıyı auth sayfalarından ana sayfaya alır.
 * - Güvenlik başlıklarını her yanıta ekler.
 */
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/settings", "/create"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  let response: NextResponse;
  if (hasSession && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    response = NextResponse.redirect(new URL("/", req.url));
  } else if (!hasSession && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
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
