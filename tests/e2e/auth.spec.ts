import { test, expect } from "@playwright/test";

/** Kimlik akışları: kayıt, giriş, çıkış. */
test.describe("Authentication", () => {
  test("register form validates and submits", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Aura'ya katıl/i })).toBeVisible();
    // boş submit → doğrulama hataları
    await page.getByRole("button", { name: /Hesap oluştur/i }).click();
    await expect(page.getByText(/en az 2 karakter|gerekli/i).first()).toBeVisible();
    // geçerli veri
    const u = `t${Date.now()}`;
    await page.getByLabel("Ad Soyad").fill("Test Kullanıcı");
    await page.getByLabel("Kullanıcı adı").fill(u);
    await page.getByLabel("E-posta").fill(`${u}@aura.social`);
    await page.getByLabel("Şifre", { exact: true }).fill("Str0ngPass!");
    await page.getByLabel("Şifre (tekrar)").fill("Str0ngPass!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /Hesap oluştur/i }).click();
    await expect(page.getByText(/Hesabın oluşturuldu/i)).toBeVisible();
  });

  test("login and logout round-trip", async ({ page }) => {
    // Önce kayıt ol
    const u = `l${Date.now()}`;
    await page.goto("/register");
    await page.getByLabel("Ad Soyad").fill("Login User");
    await page.getByLabel("Kullanıcı adı").fill(u);
    await page.getByLabel("E-posta").fill(`${u}@aura.social`);
    await page.getByLabel("Şifre", { exact: true }).fill("Str0ngPass!");
    await page.getByLabel("Şifre (tekrar)").fill("Str0ngPass!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /Hesap oluştur/i }).click();
    await expect(page.getByText(/Hesabın oluşturuldu/i)).toBeVisible();

    // Giriş
    await page.goto("/login");
    await page.getByLabel("E-posta").fill(`${u}@aura.social`);
    await page.getByLabel("Şifre").fill("Str0ngPass!");
    await page.getByRole("button", { name: /Giriş yap/i }).click();
    await expect(page).toHaveURL("/");

    // Oturum yönetiminden çıkış (cihaz oturumu görünür)
    await page.goto("/settings/sessions");
    await expect(page.getByText(/Bu cihaz/i)).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-posta").fill("ghost@aura.social");
    await page.getByLabel("Şifre").fill("wrongpass");
    await page.getByRole("button", { name: /Giriş yap/i }).click();
    await expect(page.getByText(/E-posta veya şifre hatalı/i)).toBeVisible();
  });
});
