<div align="center">

# ✦ Aura

**Premium, minimal ve mobil öncelikli sosyal medya platformu.**

Apple · Linear · Notion seviyesinde bir kullanıcı deneyimi hedefiyle, sıfırdan ve tamamen özgün olarak geliştirilen açık kaynak sosyal ağ.

[![CI](https://github.com/mrtdoan58-glitch/aura/actions/workflows/ci.yml/badge.svg)](https://github.com/mrtdoan58-glitch/aura/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-6366F1.svg)](./CHANGELOG.md)
[![Made with Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)

</div>

> **Olgunluk seviyesi (dürüst):** Aura aktif geliştirilen, **UI-önce** bir projedir. Kimlik doğrulama (Auth) ve Feed/Post sistemleri üretim kalitesinde çekirdek koda sahiptir; kalan modüller yol haritasındadır. Backend'in bir kısmı (Prisma repoları, Redis, e-posta, monitoring taşıyıcıları) yapılandırılmış ama bazı operasyonel entegrasyonlar dağıtım ortamında etkinleştirilir. Ayrıntı için [RELEASE.md](./RELEASE.md).

---

## İçindekiler

- [Öne çıkanlar](#öne-çıkanlar)
- [Ekran görüntüleri](#ekran-görüntüleri)
- [Teknoloji yığını](#teknoloji-yığını)
- [Mimari](#mimari)
- [Kurulum](#kurulum)
- [Geliştirme](#geliştirme)
- [Test](#test)
- [Docker](#docker)
- [CI/CD](#cicd)
- [Yol haritası](#yol-haritası)
- [Katkı](#katkı)
- [Güvenlik](#güvenlik)
- [Lisans](#lisans)

---

## Öne çıkanlar

- **Kimlik doğrulama** — kayıt, giriş, çıkış, e-posta doğrulama, şifre sıfırlama, **refresh token rotation** + reuse-detection, cihaz oturumları, hesap kilitleme, rate limiting, CSRF, TOTP 2FA altyapısı, RBAC.
- **Feed & Post** — cursor pagination, infinite scroll, optimistic like/save, yorumlar, media carousel, görsel optimizasyonu (blur LQIP, AVIF/WebP), story ring & viewer, skeleton/empty/error durumları.
- **Tasarım sistemi** — 8px grid, tutarlı token'lar, light/dark mod, WCAG odaklı erişilebilirlik, akıcı mikro-animasyonlar.
- **Clean Architecture** — domain / servis / repository katmanları, SOLID, Dependency Injection, tamamen test edilebilir (DB'siz in-memory + gerçek Postgres runtime testleri).

## Ekran görüntüleri

> Görselleri buraya ekleyin (`docs/screenshots/`).

| Feed (Light) | Feed (Dark) | Story Viewer | Auth |
|---|---|---|---|
| ![Feed light](docs/screenshots/feed-light.png) | ![Feed dark](docs/screenshots/feed-dark.png) | ![Story](docs/screenshots/story.png) | ![Login](docs/screenshots/login.png) |

| Explore | Profile | Comments | Responsive (Desktop) |
|---|---|---|---|
| ![Explore](docs/screenshots/explore.png) | ![Profile](docs/screenshots/profile.png) | ![Comments](docs/screenshots/comments.png) | ![Desktop](docs/screenshots/desktop.png) |

## Teknoloji yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Dil | TypeScript (strict) |
| Stil | Tailwind CSS 4, shadcn/ui deseni |
| Animasyon | Framer Motion |
| İkonlar | Lucide |
| İstemci durumu | Zustand |
| Sunucu durumu | TanStack Query |
| Formlar | React Hook Form + Zod |
| Veritabanı | PostgreSQL + Prisma ORM |
| Kimlik | Elle yazılmış session-based auth (Lucia deseni, `node:crypto`) |
| Test | Vitest (unit/integration + gerçek PG via PGlite), Playwright (E2E) |
| Gözlemlenebilirlik | Sentry, OpenTelemetry, yapısal loglama |
| Altyapı | Docker, docker-compose, GitHub Actions |
| Kalite | ESLint, Prettier |

## Mimari

```
src/
├── app/               # App Router route'ları, API handler'ları, layout'lar
├── components/        # ui / layout / feed / auth (atomic design)
├── server/            # domain + servis + repository katmanları
│   ├── auth/          # kimlik doğrulama çekirdeği
│   ├── feed/          # feed & post çekirdeği
│   ├── rate-limit/    # rate limiter soyutlaması
│   └── observability/ # logger / OTel
├── hooks/  lib/  store/  types/
prisma/                # schema + migrations + seed
tests/                 # unit / integration / db / e2e
```

Katmanlar arayüzlerle gevşek bağlı (Dependency Inversion): iş kuralları `server/*/services`, veri erişimi `repositories/{in-memory,prisma}`. Bu sayede tüm mantık veritabanı olmadan test edilebilir; üretimde Prisma bağımlılıkları composition-root'tan enjekte edilir.

## Kurulum

```bash
git clone https://github.com/mrtdoan58-glitch/aura.git
cd aura
npm install
cp .env.example .env      # değerleri doldurun
```

Varsayılan `AUTH_DRIVER=memory` ile **veritabanı olmadan** çalışır (dev/demo). Gerçek Postgres için:

```bash
# .env → DATABASE_URL ve AUTH_DRIVER=prisma
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Geliştirme

```bash
npm run dev            # http://localhost:3000
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm run format         # Prettier
```

## Test

```bash
npm run test           # unit + integration + gerçek DB (PGlite) — DB kurulumu gerektirmez
npm run test:db        # yalnızca veritabanı runtime testleri
npm run test:e2e       # Playwright (build + tarayıcı gerektirir)
```

## Docker

```bash
docker compose up --build
# app → http://localhost:3000  ·  postgres:5432  ·  redis:6379
```

## CI/CD

Her PR'da GitHub Actions çalışır: **ESLint → TypeScript → Unit/Integration/DB testleri → Production build → Bundle analiz → Playwright E2E** (postgres servisiyle). Bkz. `.github/workflows/ci.yml`.

## Yol haritası

| Faz | Kapsam | Durum |
|---|---|---|
| Sprint 1 | Authentication | ✅ |
| Sprint 2 | Feed & Post | ✅ |
| Sprint 2.5 | Production hardening (CI, Docker, monitoring, DB runtime) | ✅ |
| Sprint 3 | Story (oluşturma/görüntüleme) | ⬜ |
| Sprint 4 | Explore & Discover | ⬜ |
| Sprint 5 | Search & Hashtag/Location | ⬜ |
| Sprint 6 | Reels / Short Video | ⬜ |
| Sprint 7 | Messaging (realtime) | ⬜ |
| Sprint 8 | Notifications & Push | ⬜ |
| Sprint 9 | Profile & Relations | ⬜ |
| Sprint 10 | Settings & Privacy (KVKK/GDPR) | ⬜ |
| Sprint 11 | Moderation & Admin | ⬜ |
| Sprint 12 | Scale & polish | ⬜ |

Detaylı plan: `docs/roadmap.md`.

## Katkı

Katkılar memnuniyetle karşılanır. Lütfen [CONTRIBUTING.md](./CONTRIBUTING.md) dosyasını okuyun. Küçük düzeltmeler için doğrudan PR açabilir, büyük değişiklikler için önce bir issue açabilirsiniz.

## Güvenlik

Bir güvenlik açığı bulduysanız lütfen [SECURITY.md](./SECURITY.md) içindeki sorumlu ifşa sürecini izleyin — herkese açık issue **açmayın**.

## Lisans

[MIT](./LICENSE) © Aura katkıcıları.
