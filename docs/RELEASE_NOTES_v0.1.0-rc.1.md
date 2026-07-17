# Aura v0.1.0-rc.1 — Release Candidate

**Tarih:** 2026-07-17 · **Tür:** Release Candidate (ilk açık kaynak sürüm adayı)

İlk herkese açık sürümün release adayı. Auth + Feed çekirdeği üretim kalitesinde; mühendislik altyapısı (test, CI, Docker, monitoring) tamam. **Bu sürümde production build gerçekten alındı ve doğrulandı.**

## Doğrulanan (bu ortamda gerçekten çalıştırıldı)
- ✅ `npm install` — bağımlılıklar kurulu
- ✅ `npm run lint` — 0 hata / 0 uyarı
- ✅ `npm run typecheck` — 0 hata
- ✅ `npm test` — **70/70 test geçti** (unit + integration + gerçek PostgreSQL/PGlite)
- ✅ `npm run build` — **başarılı** (17/17 statik sayfa, BUILD_ID + manifest'ler üretildi)
- ✅ `npm audit` — kritik Next.js açıkları **giderildi** (15.5.20'ye yükseltme)

## Bu adayda yapılan düzeltmeler
- 🔒 Next.js 15.1.6 → **15.5.20** (CVE-2025-29927 middleware auth bypass + çok sayıda advisory kapatıldı)
- 🐛 Edge middleware'e `node:crypto` sızması giderildi (cookie sabitleri saf modüle ayrıldı)
- 🧹 Ölü kod kaldırıldı (`feed-store`, kullanılmayan `skeleton`)
- 🔌 `OtelLogger` (log↔trace korelasyonu) ve env doğrulaması bağlandı
- ♿ Skip-link, `aria-live` toast, focus-visible; SEO: metadataBase, twitter, robots.ts, sitemap.ts

## Gerçek ölçümler
- **Client bundle:** ~1.4 MB ham (framework 177KB + main 125KB paylaşılan; sayfa chunk'ları 17–25KB), CSS 36.7KB
- **Build derleme süresi:** ~10–12s (cache'li)

## Çalıştırılamayan (dürüst)
- ❌ Playwright E2E — tarayıcı gerektirir; CI'da koşar (specs + config hazır)
- ❌ Lighthouse — çalışan sunucu + Chrome gerektirir; CI'da koşar (lighthouserc hazır)
- ❌ Docker imaj derleme — sandbox'ta docker yok; Dockerfile hazır
- ⚠️ Route-size tablosu — build 45s komut limitini aşan finalizasyonda kesildi; boyutlar üretilmiş chunk'lardan ölçüldü (yukarıda)

## Bilinen sınırlamalar
Explore/Notifications/Messages/Profile ekranları hâlâ Phase-1 statik verisiyle; medya yükleme, öneri, KVKK/GDPR akışları yok. Detay: [RELEASE.md](../RELEASE.md).

## RC → Final için kalanlar
- CI'da build + e2e + lighthouse yeşil koşusu (kanıt)
- Kalan transitive `npm audit` moderate'leri (Dependabot izliyor)
