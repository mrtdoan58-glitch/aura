"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { registerAction, type ActionState } from "@/server/actions/auth-actions";
import { TextField, PasswordField } from "@/components/auth/form-controls";
import { FormBanner, SubmitButton } from "@/components/auth/form-parts";

export function RegisterForm({ csrf }: { csrf: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), mode: "onTouched" });
  // react-hook-form'un watch() dönüşü doğası gereği memoize edilemez (canlı alan
  // değeri okur); React Compiler bu bileşeni bu yüzden atlıyor — kütüphane
  // kısıtı, kodda düzeltilecek bir şey yok.
  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch("password") ?? "";

  const onSubmit = (values: RegisterInput) => {
    const fd = new FormData();
    fd.set("csrf", csrf);
    fd.set("name", values.name);
    fd.set("username", values.username);
    fd.set("email", values.email);
    fd.set("password", values.password);
    fd.set("confirmPassword", values.confirmPassword);
    fd.set("acceptTerms", values.acceptTerms ? "true" : "false");
    startTransition(async () => setState(await registerAction({ ok: false }, fd)));
  };

  if (state?.ok) return <FormBanner type="success" message={state.message ?? "Hesabın oluşturuldu."} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {state?.error && <FormBanner type="error" message={state.error} />}
      <TextField label="Ad Soyad" autoComplete="name" placeholder="Deniz Aksoy"
        error={errors.name?.message} {...register("name")} />
      <TextField label="Kullanıcı adı" autoComplete="username" placeholder="denizaksoy"
        error={errors.username?.message} {...register("username")} />
      <TextField label="E-posta" type="email" autoComplete="email" placeholder="ornek@aura.social"
        error={errors.email?.message} {...register("email")} />
      <PasswordField label="Şifre" autoComplete="new-password" placeholder="En az 8 karakter"
        showStrength value={password} error={errors.password?.message} {...register("password")} />
      <PasswordField label="Şifre (tekrar)" autoComplete="new-password" placeholder="••••••••"
        error={errors.confirmPassword?.message} {...register("confirmPassword")} />

      <label className="mb-5 flex items-start gap-2 text-[13px] font-medium text-fg-2">
        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--primary)]" {...register("acceptTerms")} />
        <span>
          <b className="font-semibold text-primary">Kullanım Şartları</b> ve{" "}
          <b className="font-semibold text-primary">Gizlilik Politikası</b>&apos;nı kabul ediyorum.
          {errors.acceptTerms && <span className="mt-1 block text-danger">{errors.acceptTerms.message}</span>}
        </span>
      </label>

      <SubmitButton pending={pending}>Hesap oluştur</SubmitButton>
    </form>
  );
}
