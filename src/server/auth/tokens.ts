/**
 * Kriptografik token üretimi ve hash'leme.
 * Düz token yalnızca istemciye/e-postaya gider; DB'de yalnızca SHA-256 hash saklanır.
 */
import { randomBytes, createHash } from "node:crypto";

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Sabit-zamanlı OTP (e-posta doğrulama kodu) — 6 haneli. */
export function generateNumericCode(digits = 6): string {
  const max = 10 ** digits;
  const n = randomBytes(4).readUInt32BE(0) % max;
  return n.toString().padStart(digits, "0");
}
