"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, MailCheck } from "lucide-react";
import { verifyEmailAction, type ActionState } from "@/server/actions/auth-actions";

/**
 * E-posta doğrulama, GET render sırasında değil yalnızca açık kullanıcı eylemiyle tetiklenir.
 * Bu, e-posta tarayıcılarının / link prefetch'in token'ı istemsizce tüketmesini önler (güvenlik).
 */
export function VerifyEmailConfirm({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);

  const confirm = () => startTransition(async () => setState(await verifyEmailAction(token)));

  if (state?.ok)
    return (
      <div className="flex flex-col items-center gap-4 rounded-[16px] border border-border bg-surface p-8 text-center">
        <CheckCircle2 className="h-14 w-14 text-success" />
        <p className="text-[14.5px] text-fg-2">{state.message}</p>
        <Link href="/login" className="mt-2 flex h-11 w-full items-center justify-center rounded-[14px] bg-primary font-bold text-white">
          Giriş yap
        </Link>
      </div>
    );

  if (state && !state.ok)
    return (
      <div className="flex flex-col items-center gap-4 rounded-[16px] border border-border bg-surface p-8 text-center">
        <XCircle className="h-14 w-14 text-danger" />
        <p className="text-[14.5px] text-fg-2">{state.error}</p>
        <Link href="/login" className="mt-2 font-semibold text-primary hover:underline">
          Giriş sayfasına dön
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-4 rounded-[16px] border border-border bg-surface p-8 text-center">
      <MailCheck className="h-12 w-12 text-primary" />
      <p className="text-[14px] text-fg-2">Hesabını etkinleştirmek için doğrulamayı tamamla.</p>
      <button
        onClick={confirm}
        disabled={pending}
        className="flex h-11 w-full items-center justify-center rounded-[14px] bg-primary font-bold text-white disabled:opacity-60"
      >
        {pending ? "Doğrulanıyor…" : "E-postamı doğrula"}
      </button>
    </div>
  );
}
