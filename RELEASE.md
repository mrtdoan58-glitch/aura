# RELEASE.md — Aura v0.1.0 (İlk Açık Kaynak Sürüm)

**Sürüm:** v0.1.0 · **Durum:** Erken erişim / geliştirme önizlemesi · **Tarih:** 2026-07-17

Bu, Aura'nın ilk herkese açık sürümüdür. Amaç, üretime hazır çekirdek modülleri (Auth + Feed) ve olgun bir mühendislik altyapısını (test, CI, Docker, gözlemlenebilirlik) açık kaynak olarak paylaşmaktır. Sosyal ağın tamamı henüz bitmemiştir; yol haritası şeffaftır.

---

## ✨ Özellikler (bu sürümde çalışan)

### Kimlik doğrulama (Sprint 1)
- Kayıt, giriş, çıkış, e-posta doğrulama, şifre sıfırlama
- httpOnly + Secure + SameSite cookie; **refresh token rotation** + reuse-detection
- Cihaz oturumları (çoklu cihaz) listeleme/sonlandırma
- Hesap kilitleme (5 başarısız denemede), rate limiting, brute-force koruması
- CSRF (double-submit), kullanıcı enumeration önleme, timing-attack koruması
- TOTP 2FA altyapısı, RBAC (USER/MODERATOR/ADMIN)
- Responsive ekranlar: Login, Register, Forgot/Reset Password, Verify Email, Session Management

### Feed & Post (Sprint 2)
- Zaman-sıralı feed, **cursor pagination**, **infinite scroll**
- Optimistic **like** / **save** (+ rollback), **share** (Web Share API + kopyalama)
- **Yorumlar** (bottom-sheet, cursor sayfalama, optimistic ekleme, rate limiting)
- **Media carousel** (çoklu görsel, snap-scroll) + video altyapısı
- **Görsel optimizasyonu** (blur LQIP, AVIF/WebP, LCP priority)
- **Story ring & viewer** (progress, klavye/dokunma, görülme kaydı)
- Skeleton loading, empty state, error state

### Altyapı (Sprint 2.5)
- **Gerçek PostgreSQL runtime testleri** (migration, CRUD, transaction, rollback, constraint)
- Playwright E2E senaryoları (CI'da koşar)
- GitHub Actions CI (lint, tsc, test, build, e2e)
- Docker + docker-compose (app + postgres + redis)
- Health check, yapısal loglama, Sentry + OpenTelemetry instrumentation
- Bundle analyzer + Lighthouse yapılandırması

---

## ⚠️ Bilinen eksikler

- **Uygulanmamış modüller:** Story oluşturma, Explore/Search, Reels, Messaging, Notifications, Profile (tam), Settings, Moderation, Admin.
- **Placeholder sayfalar:** Explore/Notifications/Messages/Profile ekranları Phase-1 statik verisiyle çalışır; henüz gerçek API'ye bağlı değildir.
- **Feed sıralaması** saf zaman-tabanlıdır; öneri/kişiselleştirme yoktur.
- **Medya yükleme** yoktur (seed görseller kullanılır).
- **KVKK/GDPR** akışları (rıza, veri indir/sil) henüz yoktur.

## 🧾 Teknik borç

| Konu | Açıklama | Öncelik |
|---|---|---|
| Prisma repo runtime | Şema + repo yazıldı; gerçek Postgres'e karşı entegrasyon testi CI'da doğrulanmalı | High |
| Rate limiter (üretim) | In-memory; çok-instance için Redis adaptörü takılmalı | High |
| E-posta gönderimi | ConsoleMailer; üretimde Resend/SES bağlanmalı | High |
| CSP sıkılaştırma | `script-src 'unsafe-inline'` → nonce tabanlı | Medium |
| TOTP replay | Kullanılan counter izlenmeli (2FA açma akışıyla) | Medium |
| Refresh race | Eşzamanlı refresh için Prisma atomik update (compare-and-swap) | Medium |
| List virtualization | Çok uzun feed için `@tanstack/react-virtual` | Medium |
| Sayaç tutarlılığı | Denormalize sayaçlar için transaction + reconcile | Medium |
| Monitoring sink | Sentry/OTel taşıyıcıları env ile etkinleştirilmeli | Medium |
| Coverage eşiği | Test coverage-% kapısı eklenmeli | Low |

## 📦 Kurulum

```bash
git clone https://github.com/mrtdoan58-glitch/aura.git
cd aura && npm install
cp .env.example .env
npm run dev        # AUTH_DRIVER=memory ile DB'siz çalışır
```

Gerçek Postgres için `.env` → `DATABASE_URL` + `AUTH_DRIVER=prisma`, ardından `npm run db:generate && npm run db:migrate && npm run db:seed`.

## 🛠 Geliştirme notları

- **Test stratejisi:** iş mantığı in-memory repolarla (DB'siz) ve şema/constraint'ler gerçek PG (PGlite) ile test edilir. `npm run test` her ikisini de çalıştırır.
- **Mimari kural:** domain/servis katmanları altyapıya bağımlı olmamalı; yeni veri kaynakları repository arayüzünü uygulamalı.
- **Sunucu vs istemci:** sayfalar mümkün olduğunca Server Component; yalnız etkileşim gerektiren bileşenler `"use client"`.
- **Bilinen ortam notu:** bazı sandbox/CI dışı ortamlarda native `@next/swc` sorunları görülebilir; `next build` CI'da (Ubuntu) sorunsuz çalışır.
- **Sürümleme:** [SemVer](https://semver.org). 1.0.0'a kadar API/şema kırıcı değişebilir.

---

Ayrıntılı değişiklikler için [CHANGELOG.md](./CHANGELOG.md); katkı için [CONTRIBUTING.md](./CONTRIBUTING.md); güvenlik için [SECURITY.md](./SECURITY.md).
