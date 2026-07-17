# Changelog

Bu projedeki tüm önemli değişiklikler bu dosyada belgelenir.

Biçim [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) temellidir ve proje [Semantic Versioning](https://semver.org/lang/tr/) izler.

## [Unreleased]

### Planlanan
- Story oluşturma/görüntüleme (Sprint 3)
- Explore & Search (Sprint 4–5)
- Reels / kısa video (Sprint 6)
- Realtime mesajlaşma (Sprint 7)

---

## [0.1.0] — 2026-07-17

İlk açık kaynak sürüm. Üretim kalitesinde Auth + Feed çekirdeği ve olgun mühendislik altyapısı.

### Eklendi

**Kimlik doğrulama**
- Kayıt, giriş, çıkış, e-posta doğrulama, şifre sıfırlama akışları
- Refresh token rotation + reuse-detection; httpOnly/Secure/SameSite cookie
- Cihaz oturumları yönetimi (çoklu cihaz, sonlandırma)
- Hesap kilitleme, rate limiting, brute-force koruması
- CSRF (double-submit), timing-attack ve enumeration önleme
- TOTP 2FA altyapısı, RBAC (USER/MODERATOR/ADMIN)
- Responsive ekranlar: Login, Register, Forgot/Reset Password, Verify Email, Sessions

**Feed & Post**
- Cursor pagination + infinite scroll
- Optimistic like/save (+ rollback), share, yorumlar (rate-limited)
- Media carousel + video altyapısı; görsel optimizasyonu (blur LQIP, AVIF/WebP)
- Story ring & viewer (progress, klavye/dokunma, görülme)
- Skeleton / empty / error durumları

**Altyapı**
- Prisma şeması + `0001_init` migration + seed
- Gerçek PostgreSQL runtime testleri (PGlite): migration, CRUD, transaction, rollback, constraint
- Playwright E2E senaryoları (auth + feed + responsive)
- GitHub Actions CI (lint, tsc, test, build, e2e)
- Docker + docker-compose (app + postgres + redis)
- Health check, yapısal loglama, Sentry + OpenTelemetry instrumentation
- Bundle analyzer + Lighthouse yapılandırması
- Tasarım sistemi, light/dark mod, tam responsive layout

### Güvenlik
- scrypt şifre hash'leme; token'lar yalnız hash olarak saklanır
- Güvenlik başlıkları (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- Server-side Zod doğrulama; ownership/RBAC kontrolleri

### Bilinen sınırlamalar
- Explore/Notifications/Messages/Profile ekranları henüz statik (placeholder) veriyle
- Medya yükleme, öneri sistemi, KVKK/GDPR akışları yok
- Üretim rate limiter (Redis), e-posta gönderimi ve monitoring sink'i env ile etkinleştirilmeli

[Unreleased]: https://github.com/mrtdoan58-glitch/aura/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mrtdoan58-glitch/aura/releases/tag/v0.1.0
