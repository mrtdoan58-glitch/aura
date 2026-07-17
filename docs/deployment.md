# Aura — Dağıtım (Deployment) Rehberi

Aura standart bir Next.js 15 uygulamasıdır ve birden çok platforma dağıtılabilir. Tüm hedefler için gerekli ortam değişkenleri [.env.example](../.env.example) dosyasındadır.

## Ortam değişkenleri (özet)

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `NODE_ENV` | ✅ | `production` (dağıtımda) |
| `APP_URL` | ✅ | Genel taban URL (OG/sitemap/robots) |
| `AUTH_DRIVER` | ✅ | `prisma` (üretim) veya `memory` (demo) |
| `DATABASE_URL` | prisma ise ✅ | PostgreSQL bağlantısı |
| `REDIS_URL` | önerilir | Rate limiter/cache |
| `RESEND_API_KEY`, `EMAIL_FROM` | e-posta için | Üretim mailer |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | opsiyonel | Hata izleme |

---

## 1) Vercel (önerilen — Next.js için birinci sınıf)

1. Repoyu Vercel'e import edin.
2. Environment Variables ekleyin (yukarıdaki tablo).
3. Managed Postgres (Neon/Supabase) + Upstash Redis bağlayın.
4. Build Command: `prisma generate && next build` · Output: otomatik.
5. Deploy → her push'ta preview + prod.

```bash
npm i -g vercel
vercel           # preview
vercel --prod    # production
```

## 2) Railway (hızlı, DB dahil)

1. New Project → Deploy from GitHub.
2. Postgres + Redis eklentilerini ekleyin (env otomatik enjekte).
3. `AUTH_DRIVER=prisma` + `DATABASE_URL` (Railway'in verdiği).
4. Deploy komutları: `prisma migrate deploy && next start`.

## 3) Docker / docker-compose (self-host)

```bash
cp .env.example .env         # değerleri doldurun (AUTH_DRIVER=prisma)
docker compose up --build    # app + postgres + redis
docker compose exec app npx prisma migrate deploy
```

- Üretim imajı: çok aşamalı `Dockerfile` (standalone, non-root, healthcheck → `/api/health`).
- Geliştirme: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`.

## 4) VPS (Ubuntu, PM2 + Nginx)

```bash
# sunucuda
git clone https://github.com/mrtdoan58-glitch/aura.git && cd aura
npm ci && npx prisma generate && npx prisma migrate deploy
npm run build
pm2 start "npm run start" --name aura
# Nginx reverse proxy → 127.0.0.1:3000, TLS için certbot
```

Öneriler: systemd/PM2 ile süreç yönetimi, Nginx TLS sonlandırma, Postgres + Redis ayrı servis/container, günlük yedek (PITR).

## 5) AWS

**Seçenek A — ECS Fargate:** Docker imajını ECR'a push → ECS servisi → ALB (health check `/api/health`) → RDS Postgres + ElastiCache Redis. Secrets Manager ile env.

**Seçenek B — Amplify / App Runner:** GitHub bağla, build `prisma generate && next build`, RDS + ElastiCache bağla.

```bash
aws ecr create-repository --repository-name aura
docker build -t aura . && docker tag aura:latest <acct>.dkr.ecr.<region>.amazonaws.com/aura:latest
docker push <acct>.dkr.ecr.<region>.amazonaws.com/aura:latest
```

---

## Dağıtım öncesi kontrol
- [ ] `DATABASE_URL` erişilebilir, `prisma migrate deploy` çalıştı
- [ ] `AUTH_DRIVER=prisma`, `NODE_ENV=production`, `APP_URL` doğru
- [ ] Redis bağlı (rate limiter üretim adaptörü)
- [ ] TLS/HTTPS aktif (Secure cookie'ler için zorunlu)
- [ ] `/api/health` 200 dönüyor
- [ ] Sentry/OTel DSN'leri (izleme isteniyorsa) ayarlı
