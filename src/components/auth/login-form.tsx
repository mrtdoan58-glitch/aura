"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { loginAction, type ActionState } from "@/server/actions/auth-actions";
import { TextField, PasswordField } from "@/components/auth/form-controls";
import { FormBanner, SubmitButton } from "@/components/auth/form-parts";

export function LoginForm({ csrf }: { csrf: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);
  const [needsTotp, setNeedsTotp] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { rememberMe: false } });

  const onSubmit = (values: LoginInput) => {
    const fd = new FormData();
    fd.set("csrf", csrf);
    fd.set("email", values.email);
    fd.set("password", values.password);
    if (values.rememberMe) fd.set("rememberMe", "on");
    if (values.totp) fd.set("totp", values.totp);
    startTransition(async () => {
      const res = await loginAction({ ok: false }, fd);
      setState(res);
      if (res.code === "TWO_FACTOR_REQUIRED") setNeedsTotp(true);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {state?.error && <FormBanner type="error" message={state.error} />}
      <TextField label="E-posta" type="email" autoComplete="email" placeholder="ornek@aura.social"
        error={errors.email?.message} {...register("email")} />
      <PasswordField label="Şifre" autoComplete="current-password" placeholder="••••••••"
        error={errors.password?.message} {...register("password")} />

      {needsTotp && (
        <TextField label="2FA Kodu" inputMode="numeric" placeholder="6 haneli kod"
          error={errors.totp?.message} {...register("totp")} />
      )}

      <div className="mb-5 flex items-center justify-between">
        <label className="flex items-center gap-2 text-[13.5px] font-medium text-fg-2">
          <input type="checkbox" className="h-4 w-4 rounded border-border accent-[var(--primary)]" {...register("rememberMe")} />
          Beni hatırla
        </label>
        <Link href="/forgot-password" className="text-[13.5px] font-semibold text-primary hover:underline">
          Şifremi unuttum
        </Link>
      </div>

      <SubmitButton pending={pending}>Giriş yap</SubmitButton>
    </form>
  );
}
