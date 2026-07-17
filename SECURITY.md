# Güvenlik Politikası

Aura'nın güvenliğini ciddiye alıyoruz. Bu belge, güvenlik açıklarını sorumlu şekilde bildirme sürecini açıklar.

## Desteklenen sürümler

| Sürüm | Destek |
|---|---|
| 0.1.x | ✅ Güvenlik düzeltmeleri |
| < 0.1 | ❌ |

Proje 1.0.0 öncesi olduğundan, güvenlik düzeltmeleri en son `main` ve en güncel `0.1.x` üzerinde uygulanır.

## Bir açığı bildirme

**Lütfen güvenlik açıklarını herkese açık GitHub issue olarak AÇMAYIN.**

Bunun yerine:

1. GitHub **Security Advisories** üzerinden özel bir bildirim aç: `Security` sekmesi → *Report a vulnerability*.
2. Alternatif olarak **security@<alan-adı>** adresine e-posta gönder.
3. Mümkünse şunları ekle:
   - Açığın türü ve etkisi
   - Yeniden üretme adımları / PoC
   - Etkilenen dosya/uç nokta
   - Önerilen düzeltme (varsa)

## Sürecimiz

| Aşama | Hedef süre |
|---|---|
| İlk yanıt (aldığımızı onaylama) | 48 saat içinde |
| İlk değerlendirme / önem derecesi | 5 iş günü içinde |
| Düzeltme veya azaltma planı | önem derecesine göre |
| Kamuya açıklama (koordineli) | düzeltme yayınlandıktan sonra |

Sorumlu ifşa süreci boyunca seninle iletişimde kalır, kredi vermek istersen adını (veya rumuzunu) danışma metninde belirtiriz.

## Kapsam

**Kapsam içinde:** kimlik doğrulama, oturum/token yönetimi, yetkilendirme (RBAC/IDOR), girdi doğrulama, XSS/CSRF/SSRF, rate limiting atlatma, veri sızıntısı.

**Kapsam dışı:** üçüncü taraf servislerdeki açıklar, sosyal mühendislik, fiziksel erişim, henüz uygulanmamış (yol haritasındaki) özellikler.

## Uygulanan güvenlik önlemleri

Mevcut kod tabanı şunları içerir:

- Şifreler `scrypt` ile hash'li; token'lar DB'de yalnız SHA-256 hash olarak
- httpOnly + Secure + SameSite cookie; refresh token rotation + reuse-detection
- CSRF (double-submit) + Next.js Server Actions origin kontrolü
- Rate limiting (login/OTP/yorum) + hesap kilitleme + brute-force koruması
- Timing-attack ve kullanıcı enumeration önleme
- Server-side girdi doğrulama (Zod) + Prisma parametreli sorgular
- Güvenlik başlıkları (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- RBAC + kaynak sahipliği (ownership) kontrolleri

## Bilinen sınırlamalar (şeffaflık)

- CSP `script-src 'unsafe-inline'` içerir (nonce'a sıkılaştırma planlı).
- Üretim rate limiter'ı (Redis) ve e-posta gönderimi dağıtım ortamında etkinleştirilmelidir.
- 2FA replay koruması (kullanılan counter izleme) 2FA açma akışıyla eklenecektir.

Detaylar ve öncelikler için [RELEASE.md](./RELEASE.md) teknik borç bölümüne bakın.

Katkın için teşekkürler — sorumlu ifşa, kullanıcılarımızı korur. 🛡️
