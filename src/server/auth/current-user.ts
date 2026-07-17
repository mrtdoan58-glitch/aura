/**
 * Geçerli oturumu cookie'den çözer. RSC ve server action'larda kullanılır.
 */
import { cache } from "react";
import { getAuthService } from "@/server/auth/container";
import { getSessionToken } from "@/server/auth/cookies";
import type { User } from "@/server/auth/domain";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getSessionToken();
  if (!token) return null;
  const svc = getAuthService();
  const session = await svc.getValidSessionByToken(token);
  if (!session) return null;
  return svc.getUserById(session.userId);
});
