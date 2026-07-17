/** Ortak auth hata taksonomisi — tutarlı kod + mesaj. */
export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_TAKEN"
  | "USERNAME_TAKEN"
  | "ACCOUNT_LOCKED"
  | "RATE_LIMITED"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "TWO_FACTOR_REQUIRED"
  | "TWO_FACTOR_INVALID"
  | "SESSION_INVALID"
  | "TOKEN_REUSE_DETECTED";

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
    readonly meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AuthError";
  }
}
