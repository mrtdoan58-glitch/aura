import { describe, it, expect } from "vitest";
import { generateToken, hashToken, generateNumericCode } from "@/server/auth/tokens";

describe("tokens", () => {
  it("generates url-safe tokens", () => {
    const t = generateToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it("hashes deterministically", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
  it("generates numeric codes of fixed length", () => {
    expect(generateNumericCode(6)).toMatch(/^\d{6}$/);
  });
});
