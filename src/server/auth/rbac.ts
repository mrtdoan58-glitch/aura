/**
 * RBAC — rol tabanlı erişim kontrolü altyapısı.
 * Roller hiyerarşik: ADMIN > MODERATOR > USER. İzinler role eşlenir.
 */
import type { Role } from "@/server/auth/domain";

const RANK: Record<Role, number> = { USER: 1, MODERATOR: 2, ADMIN: 3 };

export type Permission =
  | "post:create"
  | "post:delete:any"
  | "comment:moderate"
  | "user:ban"
  | "report:resolve"
  | "admin:access";

const PERMISSIONS: Record<Role, Permission[]> = {
  USER: ["post:create"],
  MODERATOR: ["post:create", "comment:moderate", "report:resolve", "post:delete:any"],
  ADMIN: ["post:create", "comment:moderate", "report:resolve", "post:delete:any", "user:ban", "admin:access"],
};

export function hasRole(userRole: Role, required: Role): boolean {
  return RANK[userRole] >= RANK[required];
}

export function can(userRole: Role, permission: Permission): boolean {
  return PERMISSIONS[userRole].includes(permission);
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN";
  constructor(message = "Bu işlem için yetkiniz yok.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function requirePermission(userRole: Role, permission: Permission): void {
  if (!can(userRole, permission)) throw new ForbiddenError();
}
