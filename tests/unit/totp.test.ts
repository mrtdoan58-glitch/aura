import { describe, it, expect } from "vitest";
import { generateTotpSecret, generateTotp, verifyTotp, otpauthUri } from "@/server/auth/totp";

describe("TOTP (2FA)", () => {
  it("generates a base32 secret", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(16);
  });

  it("verifies a freshly generated code", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const code = generateTotp(secret, now);
    expect(verifyTotp(secret, code, now)).toBe(true);
  });

  it("rejects an invalid code", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, "000000", Date.now())).toBe(false);
  });

  it("accepts a code within the ±1 step window", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const prev = generateTotp(secret, now - 30_000);
    expect(verifyTotp(secret, prev, now, 1)).toBe(true);
  });

  it("builds a valid otpauth URI", () => {
    const uri = otpauthUri("ABC234", "user@aura.social");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("secret=ABC234");
  });
});
