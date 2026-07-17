/** Saf cookie isim sabitleri — Edge runtime (middleware) için node:crypto çekmeden paylaşılır. */
export const SESSION_COOKIE = "aura_session";
export const CSRF_COOKIE = "aura_csrf";

/**
 * Cookie'lerin `Secure` bayrağı bağlantının gerçekten HTTPS olup olmadığına göre
 * belirlenmeli — `NODE_ENV=production` build modunu ifade eder, taşıma güvenliğini
 * değil. Production build'i HTTP üzerinden (ör. E2E) sunulduğunda `NODE_ENV`'e
 * bağlamak tarayıcının Secure cookie'yi hiç göndermemesine yol açar (WebKit'te
 * Chromium'daki gibi localhost istisnası yoktur). `APP_URL` gerçek dağıtım
 * adresini yansıttığından daha güvenilir bir sinyal.
 */
export function isSecureCookieContext(): boolean {
  return (process.env.APP_URL ?? "http://localhost:3000").startsWith("https://");
}
