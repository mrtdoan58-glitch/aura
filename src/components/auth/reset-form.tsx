"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { resetPasswordAction, type ActionState } from "@/server/actions/auth-actions";
import { PasswordField } from "@/components/auth/form-controls";
import { FormBanner, SubmitButton } from "@/components/auth/form-parts";

export function ResetForm({ csrf, token }: { csrf: string; token: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token } });
  // react-hook-form'un watch() dönüşü doğası gereği memoize edilemez (canlı alan
  // değeri okur); React Compiler bu bileşeni bu yüzden atlıyor — kütüphane
  // kısıtı, kodda düzeltilecek bir şey yok.
  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch("password") ?? "";

  const onSubmit = (values: ResetPasswordInput) => {
    const fd = new FormData();
    fd.set("csrf", csrf);
    fd.set("token", token);
    fd.set("password", values.password);
    fd.set("confirmPassword", values.confirmPassword);
    startTransition(async () => setState(await resetPasswordAction({ ok: false }, fd)));
  };

  if (state?.ok)
    return (
      <div>
        <FormBanner type="success" message={state.message ?? "Şifren güncellendi."} />
        <Link href="/login" className="mt-2 block text-center text-[14px] font-semibold text-primary hover:underline">
          Giriş sayfasına dön
        </Link>
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {state?.error && <FormBanner type="error" message={state.error} />}
      <input type="hidden" {...register("token")} />
      <PasswordField label="Yeni şifre" autoComplete="new-password" placeholder="En az 8 karakter"
        showStrength value={password} error={errors.password?.message} {...register("password")} />
      <PasswordField label="Yeni şifre (tekrar)" autoComplete="new-password" placeholder="••••••••"
        error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <SubmitButton pending={pending}>Şifreyi güncelle</SubmitButton>
    </form>
  );
}
