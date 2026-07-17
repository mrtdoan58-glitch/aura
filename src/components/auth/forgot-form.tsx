"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { forgotPasswordAction, type ActionState } from "@/server/actions/auth-actions";
import { TextField } from "@/components/auth/form-controls";
import { FormBanner, SubmitButton } from "@/components/auth/form-parts";

export function ForgotForm({ csrf }: { csrf: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = (values: ForgotPasswordInput) => {
    const fd = new FormData();
    fd.set("csrf", csrf);
    fd.set("email", values.email);
    startTransition(async () => setState(await forgotPasswordAction({ ok: false }, fd)));
  };

  if (state?.ok) return <FormBanner type="success" message={state.message ?? "Bağlantı gönderildi."} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {state?.error && <FormBanner type="error" message={state.error} />}
      <TextField label="E-posta" type="email" autoComplete="email" placeholder="ornek@aura.social"
        error={errors.email?.message} {...register("email")} />
      <SubmitButton pending={pending}>Sıfırlama bağlantısı gönder</SubmitButton>
    </form>
  );
}
