import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("Str0ngPass!");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Str0ngPass!", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Str0ngPass!");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces unique salts (different hashes for same input)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });

  it("returns false for malformed stored hash", async () => {
    expect(await verifyPassword("x", "not-a-valid-hash")).toBe(false);
  });
});
