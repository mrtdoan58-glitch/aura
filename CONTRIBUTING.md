# Aura'ya Katkı Rehberi

Aura'ya katkıda bulunmak istediğin için teşekkürler! Bu rehber, katkı sürecini herkes için öngörülebilir ve kaliteli tutmayı amaçlar.

## Davranış Kuralları

Bu proje bir [Davranış Kuralları](./CODE_OF_CONDUCT.md) benimser. Katılarak bu kurallara uymayı kabul edersin. Saygılı, kapsayıcı ve yapıcı ol.

## Başlamadan önce

- Büyük değişiklikler için **önce bir issue aç** ve tartış — boşa emek harcanmasını önler.
- Küçük düzeltmeler (yazım, ufak bug) için doğrudan PR açabilirsin.
- Üzerinde çalışmak istediğin issue'ya yorum bırak ki çift iş olmasın.

## Geliştirme ortamı

```bash
git clone https://github.com/mrtdoan58-glitch/aura.git
cd aura
npm install
cp .env.example .env
npm run dev
```

Node 22+ gereklidir (`.nvmrc`). Veritabanı olmadan `AUTH_DRIVER=memory` ile çalışabilirsin.

## Dal ve commit kuralları

- **Dal adı:** `feat/kisa-aciklama`, `fix/...`, `docs/...`, `chore/...`, `test/...`
- **Commit:** [Conventional Commits](https://www.conventionalcommits.org) — `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`, `test: ...`, `chore: ...`
- Örnek: `feat(feed): add cursor pagination to comments`

## Kod standartları

- **TypeScript strict** — `any` kullanma; tipleri açık tut.
- **Clean Architecture** — iş kuralları `server/*/services`, veri erişimi repository arayüzleri üzerinden. Domain katmanı çerçeveden/altyapıdan bağımsız kalmalı.
- **SOLID / DRY / KISS** — tekrarları soyutla, ama gereksiz karmaşıklıktan kaçın.
- **Server-first** — mümkünse Server Component; `"use client"` yalnız gerektiğinde.
- **Erişilebilirlik** — ARIA, klavye erişimi, kontrast; yeni UI için zorunlu.
- **Güvenlik** — girdi doğrulama server tarafında (Zod), yetki kontrolü her mutasyonda.

Kaydetmeden önce:

```bash
npm run lint        # 0 hata olmalı
npm run typecheck   # 0 hata olmalı
npm run test        # tüm testler yeşil olmalı
npm run format      # Prettier
```

## Testler

- Yeni iş mantığı için **birim/entegrasyon testi** ekle (in-memory repolarla, DB gerektirmez).
- Şema/constraint değişikliği için `tests/db/` altına **gerçek PG (PGlite)** testi ekle.
- Kullanıcı akışı değişiklikleri için mümkünse **Playwright** senaryosu ekle.
- Negatif ve edge case'leri de kapsa (yalnız mutlu yol değil).

## Pull Request süreci

1. Fork'la ve bir dal aç.
2. Değişikliğini yap; testleri ve kalite kapılarını yerelde geçir.
3. PR açıklamasında **ne / neden** anlat; ilgili issue'yu bağla (`Closes #123`).
4. PR şablonundaki kontrol listesini doldur.
5. CI (lint + tsc + test + build + e2e) yeşil olmalı.
6. En az bir onay (review) sonrası merge edilir. `main` korumalıdır.

### PR kontrol listesi (şablon)

- [ ] Testler eklendi/güncellendi ve geçiyor
- [ ] `lint` + `typecheck` temiz
- [ ] Erişilebilirlik gözetildi
- [ ] Güvenlik etkisi değerlendirildi (yetki, girdi doğrulama)
- [ ] Dokümantasyon/CHANGELOG güncellendi (gerekliyse)
- [ ] Kırıcı değişiklik varsa açıkça belirtildi

## Mimari kararlar (ADR)

Önemli mimari kararlar için `docs/adr/` altına kısa bir ADR ekle (bağlam → karar → sonuç). Örnek: veritabanı seçimi, auth stratejisi.

## Sürümleme

[SemVer](https://semver.org) izlenir. Kırıcı değişiklikler `BREAKING CHANGE:` ile işaretlenir ve minor/major sürümde toplanır.

## Sorular

Bir sorun mu var? Bir **Discussion** aç ya da ilgili issue'da sor. Yardım etmekten mutluluk duyarız. 🙌
