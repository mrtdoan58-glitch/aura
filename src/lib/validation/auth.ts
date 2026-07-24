import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı")
  .max(128, "Şifre çok uzun")
  .regex(/[a-z]/, "En az bir küçük harf")
  .regex(/[A-Z]/, "En az bir büyük harf")
  .regex(/[0-9]/, "En az bir rakam");

export const registerSchema = z
  .object({
    name: z.string().min(2, "İsim en az 2 karakter").max(60),
    username: z
      .string()
      .min(3, "Kullanıcı adı en az 3 karakter")
      .max(24)
      .regex(/^[a-z0-9_]+$/i, "Yalnızca harf, rakam ve alt çizgi"),
    email: z.string().email("Geçerli bir e-posta gir"),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { error: "Şartları kabul etmelisin" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z.string().min(1, "Şifre gerekli"),
  rememberMe: z.boolean().optional().default(false),
  totp: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({ token: z.string().min(1) });

export const updateProfileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter").max(60, "İsim çok uzun"),
  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter")
    .max(24, "Kullanıcı adı çok uzun")
    .regex(/^[a-z0-9_]+$/i, "Yalnızca harf, rakam ve alt çizgi"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
