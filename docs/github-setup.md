# GitHub Depo Yapılandırması — Aura

Bu belge, Aura'yı açık kaynak olarak yayınlarken GitHub tarafında kurulması önerilen etiketler, milestone'lar, proje panosu, sürümleme ve ilk release kontrol listesini içerir.

---

## 6. Önerilen Etiketler (Labels)

Aşağıdaki etiket seti hem issue hem PR için kullanılır. Renkler tutarlı bir görsel dil sağlar. (Makine tarafından uygulanabilir sürüm: `.github/labels.yml`.)

### Tür (type)
| Etiket | Renk | Açıklama |
|---|---|---|
| `type: feature` | `#2563EB` | Yeni özellik |
| `type: bug` | `#EF4444` | Hata |
| `type: docs` | `#0EA5E9` | Dokümantasyon |
| `type: refactor` | `#8B5CF6` | Davranışı değiştirmeyen iyileştirme |
| `type: test` | `#10B981` | Test ekleme/düzeltme |
| `type: chore` | `#6B7280` | Araç/bakım/altyapı |
| `type: security` | `#B91C1C` | Güvenlik |

### Öncelik (priority)
| Etiket | Renk | Açıklama |
|---|---|---|
| `priority: critical` | `#7F1D1D` | Acil, engelleyici |
| `priority: high` | `#DC2626` | Yüksek |
| `priority: medium` | `#F59E0B` | Orta |
| `priority: low` | `#84CC16` | Düşük |

### Alan (area)
| Etiket | Renk | Açıklama |
|---|---|---|
| `area: auth` | `#4F46E5` | Kimlik doğrulama |
| `area: feed` | `#2563EB` | Feed & Post |
| `area: story` | `#EC4899` | Hikayeler |
| `area: messaging` | `#06B6D4` | Mesajlaşma |
| `area: ui/ux` | `#A855F7` | Arayüz/deneyim |
| `area: infra` | `#334155` | CI/CD, Docker, altyapı |
| `area: db` | `#0F766E` | Veritabanı/şema |
| `area: perf` | `#F97316` | Performans |
| `area: a11y` | `#65A30D` | Erişilebilirlik |

### Durum / iş akışı (status)
| Etiket | Renk | Açıklama |
|---|---|---|
| `status: triage` | `#E5E7EB` | Değerlendirme bekliyor |
| `status: ready` | `#22C55E` | Başlanabilir |
| `status: in progress` | `#3B82F6` | Üzerinde çalışılıyor |
| `status: blocked` | `#EF4444` | Engelli |
| `status: needs review` | `#F59E0B` | İnceleme bekliyor |

### Topluluk
| Etiket | Renk | Açıklama |
|---|---|---|
| `good first issue` | `#7057FF` | Yeni katkıcılar için uygun |
| `help wanted` | `#008672` | Yardım aranıyor |
| `discussion` | `#CBD5E1` | Tartışma gerektirir |
| `wontfix` | `#9CA3AF` | Düzeltilmeyecek |
| `duplicate` | `#D1D5DB` | Tekrar |

### Makine tarafından uygulanabilir `.github/labels.yml`
```yaml
# github-label-sync ile: npx github-label-sync --labels .github/labels.yml mrtdoan58-glitch/aura
- name: "type: feature"
  color: "2563EB"
- name: "type: bug"
  color: "EF4444"
- name: "type: docs"
  color: "0EA5E9"
- name: "type: refactor"
  color: "8B5CF6"
- name: "type: test"
  color: "10B981"
- name: "type: chore"
  color: "6B7280"
- name: "type: security"
  color: "B91C1C"
- name: "priority: critical"
  color: "7F1D1D"
- name: "priority: high"
  color: "DC2626"
- name: "priority: medium"
  color: "F59E0B"
- name: "priority: low"
  color: "84CC16"
- name: "area: auth"
  color: "4F46E5"
- name: "area: feed"
  color: "2563EB"
- name: "area: story"
  color: "EC4899"
- name: "area: messaging"
  color: "06B6D4"
- name: "area: ui/ux"
  color: "A855F7"
- name: "area: infra"
  color: "334155"
- name: "area: db"
  color: "0F766E"
- name: "area: perf"
  color: "F97316"
- name: "area: a11y"
  color: "65A30D"
- name: "status: triage"
  color: "E5E7EB"
- name: "status: ready"
  color: "22C55E"
- name: "status: in progress"
  color: "3B82F6"
- name: "status: blocked"
  color: "EF4444"
- name: "status: needs review"
  color: "F59E0B"
- name: "good first issue"
  color: "7057FF"
- name: "help wanted"
  color: "008672"
- name: "discussion"
  color: "CBD5E1"
- name: "wontfix"
  color: "9CA3AF"
- name: "duplicate"
  color: "D1D5DB"
```

---

## 7. Milestone Planı (Sprintlere karşılık)

| Milestone | Kapsam | Durum |
|---|---|---|
| **v0.1.0 — Auth + Feed** | Sprint 1, 2, 2.5 | ✅ Tamamlandı (bu release) |
| **v0.2.0 — Story** | Sprint 3: hikaye oluşturma/görüntüleme, TTL | ⬜ |
| **v0.3.0 — Explore & Search** | Sprint 4–5: keşfet, arama, hashtag/konum | ⬜ |
| **v0.4.0 — Reels** | Sprint 6: dikey video + medya işleme | ⬜ |
| **v0.5.0 — Messaging** | Sprint 7: realtime sohbet | ⬜ |
| **v0.6.0 — Notifications & Push** | Sprint 8 | ⬜ |
| **v0.7.0 — Profile & Relations** | Sprint 9 | ⬜ |
| **v0.8.0 — Settings & Privacy** | Sprint 10: KVKK/GDPR | ⬜ |
| **v0.9.0 — Moderation & Admin** | Sprint 11 | ⬜ |
| **v1.0.0 — Scale & Polish** | Sprint 12: performans, ölçek, sertleştirme | ⬜ |

Her milestone bir GitHub Milestone'una eşlenir; issue'lar ilgili milestone'a atanır. Milestone açıklamasına "Definition of Done" (lint/tsc/test/e2e yeşil + review) eklenir.

---

## 8. GitHub Projects — Kanban Yapısı

**Proje adı:** `Aura Development` (Projects v2, repo/organizasyon düzeyi).

### Görünümler (Views)
1. **Board (Kanban)** — durum bazlı sütunlar (aşağıda).
2. **Roadmap** — milestone'lara göre zaman çizelgesi.
3. **By Area** — alan etiketine göre gruplu tablo.
4. **My Items** — atanan işlerin kişisel görünümü.

### Kanban sütunları
| Sütun | Anlam | Giriş kriteri |
|---|---|---|
| **Backlog** | Fikirler/henüz planlanmamış | Issue açıldı |
| **Triage** | Değerlendirme | Etiket + öncelik atanacak |
| **Ready** | Başlanabilir | Kabul kriteri net, milestone atandı |
| **In Progress** | Aktif geliştirme | Bir kişi atandı, dal açıldı |
| **In Review** | PR açık, inceleme | PR bağlandı, CI yeşil |
| **Done** | Merge + kapandı | PR merge, kabul kriterleri karşılandı |

### Özel alanlar (custom fields)
- **Priority** (single select): Critical / High / Medium / Low
- **Area** (single select): Auth / Feed / Story / … 
- **Sprint** (iteration): 2 haftalık döngüler
- **Estimate** (number): efor puanı

### Otomasyonlar (built-in workflows)
- PR açılınca → *In Review*
- PR merge olunca → *Done*
- Issue kapanınca → *Done*
- `status:` etiketi değişince → ilgili sütuna taşı

---

## 9. Semantic Versioning

- **İlk sürüm: `0.1.0`** (pre-1.0). Neden 0.x: sosyal ağ modüllerinin çoğu henüz uygulanmadı ve public API/DB şeması **kırıcı değişebilir**.
- **Kurallar:**
  - `0.MINOR.PATCH` — 1.0.0 öncesi: MINOR yeni özellik/olası kırıcı değişiklik, PATCH düzeltme.
  - **`1.0.0`** — tüm çekirdek modüller (Auth, Feed, Story, Explore, Messaging, Profile, Settings, Moderation) üretim-hazır + operasyonel doğrulama (build/e2e/lighthouse CI'da yeşil) tamamlandığında.
- **Etiketleme:** her release `vX.Y.Z` git tag'i ile; Conventional Commits'ten otomatik CHANGELOG üretimi için `release-please` veya `changesets` önerilir.
- **Pre-release:** gerekirse `0.2.0-rc.1` gibi rc etiketleri.

---

## 10. İlk Release Kontrol Listesi (GitHub Release öncesi)

### Depo hijyeni
- [ ] `LICENSE` (MIT) eklendi
- [ ] `README.md`, `RELEASE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md` yerinde
- [ ] `.github/` — issue şablonları, PR şablonu, `labels.yml`, `CODEOWNERS`, `FUNDING.yml` (opsiyonel)
- [ ] `.env.example` güncel; gerçek sır/secret **commit edilmemiş**
- [ ] `.gitignore` node_modules/.next/.env kapsıyor
- [ ] `docs/screenshots/` gerçek ekran görüntüleriyle dolduruldu

### Kalite kapıları (CI'da yeşil)
- [ ] `npm run lint` — 0 hata
- [ ] `npm run typecheck` — 0 hata
- [ ] `npm run test` — unit + integration + DB yeşil
- [ ] `npm run build` — production build başarılı (CI/Ubuntu)
- [ ] `npm run test:e2e` — Playwright yeşil
- [ ] Bundle analiz raporu incelendi (aşırı büyük bağımlılık yok)
- [ ] Lighthouse: performans/a11y/SEO eşikleri karşılandı

### Güvenlik & uyum
- [ ] `npm audit` / Dependabot açık, kritik açık yok
- [ ] `gitleaks` ile sır taraması temiz
- [ ] Güvenlik başlıkları (CSP/HSTS) doğrulandı
- [ ] Lisans uyumluluğu (bağımlılıklar) gözden geçirildi

### GitHub yapılandırması
- [ ] Etiketler uygulandı (`labels.yml`)
- [ ] Milestone'lar oluşturuldu (v0.1.0 kapatılmaya hazır)
- [ ] Projects panosu kuruldu ve otomasyonlar aktif
- [ ] `main` dalı korumalı (PR + CI + review zorunlu)
- [ ] Branch/tag koruma kuralları, Actions izinleri ayarlandı

### Release
- [ ] Sürüm `package.json` → `0.1.0`
- [ ] `CHANGELOG.md` v0.1.0 bölümü tamam
- [ ] `git tag v0.1.0` + push
- [ ] GitHub Release oluşturuldu; notlar CHANGELOG'dan; "known limitations" belirgin
- [ ] Release, v0.1.0 milestone'una bağlandı
- [ ] Duyuru (README rozet güncel, varsa Discussions/duyuru)

---

Bu yapılandırma tamamlandığında depo, dış katkıcıların anlayıp güvenle katkı sağlayabileceği, profesyonel bir açık kaynak proje standardına ulaşır.
