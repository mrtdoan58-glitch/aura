import { defineConfig, devices } from "@playwright/test";

/**
 * E2E yapılandırması. CI'da `AUTH_DRIVER=memory` ile uygulama ayağa kalkar,
 * testler gerçek tarayıcıda çalışır. Mobil + masaüstü projeleri responsive'i kapsar.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    { name: "tablet", use: { ...devices["iPad Mini"] } },
  ],
  webServer: {
    // "next start", next.config.mjs'deki `output: "standalone"` (Docker build modu) ile
    // uyumlu değildir; üretimdekiyle aynı sunucu şeklini kullanmak için standalone
    // server.js'i başlatıyoruz (bkz. scripts/start-standalone.mjs).
    command: "npm run start:standalone",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { AUTH_DRIVER: "memory", NODE_ENV: "production" },
  },
});
