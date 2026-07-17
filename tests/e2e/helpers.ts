import { type Page, expect } from "@playwright/test";

/**
 * Yeni bir kullanıcı kaydedip giriş yapar. Kimlik doğrulama gerektiren
 * eylemleri (yorum, beğeni, kaydet) test eden senaryolar için fixture.
 */
export async function registerAndLogin(page: Page, prefix = "e2e"): Promise<{ email: string; password: string }> {
  const u = `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `${u}@aura.social`;
  const password = "Str0ngPass!";

  await page.goto("/register");
  await page.getByLabel("Ad Soyad").fill("E2E Kullanıcı");
  await page.getByLabel("Kullanıcı adı").fill(u);
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByLabel("Şifre (tekrar)").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Hesap oluştur/i }).click();
  await expect(page.getByText(/Hesabın oluşturuldu/i)).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: /Giriş yap/i }).click();
  await expect(page).toHaveURL("/");

  return { email, password };
}
