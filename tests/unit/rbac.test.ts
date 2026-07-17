import { describe, it, expect } from "vitest";
import { hasRole, can, requirePermission, ForbiddenError } from "@/server/auth/rbac";

describe("RBAC", () => {
  it("respects role hierarchy", () => {
    expect(hasRole("ADMIN", "MODERATOR")).toBe(true);
    expect(hasRole("USER", "MODERATOR")).toBe(false);
  });
  it("maps permissions to roles", () => {
    expect(can("USER", "post:create")).toBe(true);
    expect(can("USER", "admin:access")).toBe(false);
    expect(can("ADMIN", "admin:access")).toBe(true);
    expect(can("MODERATOR", "comment:moderate")).toBe(true);
  });
  it("throws ForbiddenError when lacking permission", () => {
    expect(() => requirePermission("USER", "user:ban")).toThrow(ForbiddenError);
    expect(() => requirePermission("ADMIN", "user:ban")).not.toThrow();
  });
});
