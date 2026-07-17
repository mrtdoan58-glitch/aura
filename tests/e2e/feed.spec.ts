import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Feed & Post", () => {
  test("feed loads posts", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("article").first()).toBeVisible({ timeout: 10_000 });
  });

  test("infinite scroll loads more posts", async ({ page }) => {
    await page.goto("/");
    await page.locator("article").first().waitFor();
    const initial = await page.locator("article").count();
    // page.mouse.wheel() mobil WebKit'te desteklenmiyor; window.scrollTo tüm
    // motorlarda çalışır ve IntersectionObserver girişte fark etmeksizin tetiklenir.
    await expect
      .poll(
        async () => {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          return page.locator("article").count();
        },
        { timeout: 10_000 }
      )
      .toBeGreaterThan(initial);
  });

  test("like toggles optimistically", async ({ page }) => {
    await page.goto("/");
    const first = page.locator("article").first();
    await first.waitFor();
    const likeBtn = first.getByRole("button", { name: /Beğen/i });
    await likeBtn.click();
    await expect(first.getByRole("button", { name: /Beğeniyi kaldır/i })).toBeVisible();
  });

  test("save toggles", async ({ page }) => {
    await page.goto("/");
    const first = page.locator("article").first();
    await first.waitFor();
    await first.getByRole("button", { name: /Kaydet/i }).click();
    await expect(first.getByRole("button", { name: /Kaydı kaldır/i })).toBeVisible();
  });

  test("opens comments sheet and adds a comment", async ({ page }) => {
    // Yorum eklemek kimlik doğrulama gerektirir (server action UNAUTHENTICATED döner).
    await registerAndLogin(page);
    await page.goto("/");
    const first = page.locator("article").first();
    await first.waitFor();
    await first.getByRole("button", { name: /Yorum yap/i }).click();
    const dialog = page.getByRole("dialog", { name: /Yorumlar/i });
    await expect(dialog).toBeVisible();
    // Metin her çalıştırmada benzersiz: AUTH_DRIVER=memory store'u tüm test koşusu
    // (ve retry'ler) boyunca paylaşıldığından, sabit bir metin önceki eklenen
    // yorumlarla çakışıp strict-mode ihlaline yol açabilir.
    const commentText = `Harika bir kompozisyon ${Date.now()}`;
    await dialog.getByLabel(/Yorum metni/i).fill(commentText);
    await dialog.getByRole("button", { name: /Gönder/i }).click();
    await expect(dialog.getByText(commentText)).toBeVisible();
  });

  test("opens story viewer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^(?!Hikayen).*/ }).first().waitFor();
    // ilk hikaye halkasına tıkla (Hikayen dışındaki)
    const stories = page.locator("button", { hasText: /elifyildiz|candemir|zeynepak/ });
    if (await stories.count()) {
      await stories.first().click();
      await expect(page.getByRole("button", { name: /Kapat/i })).toBeVisible();
    }
  });
});

test.describe("Responsive", () => {
  test("mobile shows bottom tab bar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "home" })).toBeVisible();
  });

  test("desktop shows sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Ana Sayfa/i })).toBeVisible();
  });
});
