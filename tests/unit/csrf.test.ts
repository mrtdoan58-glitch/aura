import { describe, it, expect } from "vitest";
import { generateCsrfToken, verifyCsrf } from "@/server/auth/csrf";

describe("CSRF double-submit", () => {
  it("accepts matching tokens", () => {
    const t = generateCsrfToken();
    expect(verifyCsrf(t, t)).toBe(true);
  });
  it("rejects mismatched tokens", () => {
    expect(verifyCsrf(generateCsrfToken(), generateCsrfToken())).toBe(false);
  });
  it("rejects missing tokens", () => {
    expect(verifyCsrf(undefined, "x")).toBe(false);
    expect(verifyCsrf("x", undefined)).toBe(false);
  });
});
