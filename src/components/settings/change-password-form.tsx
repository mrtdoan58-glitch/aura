"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { changePasswordAction } from "@/server/actions/settings-actions";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const showToast = useUIStore((s) => s.showToast);
  const router = useRouter();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await changePasswordAction(current, password, confirm);
      if (res.ok) {
        showToast("Şifren güncellendi");
        router.push("/settings");
      } else {
        setError(res.error ?? "Şifre değiştirilemedi.");
      }
    });
  };

  return (
    <div className="space-y-5">
      <Field label="Mevcut şifre">
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[14.5px] outline-none focus:border-primary"
        />
      </Field>
      <Field label="Yeni şifre">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[14.5px] outline-none focus:border-primary"
        />
      </Field>
      <Field label="Yeni şifre (tekrar)">
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[14.5px] outline-none focus:border-primary"
        />
      </Field>

      <p className="text-[12.5px] text-fg-3">
        En az 8 karakter; büyük harf, küçük harf ve rakam içermeli. Şifreni değiştirince diğer cihazlardaki oturumların kapanır.
      </p>

      {error && <p className="text-[13.5px] font-medium text-danger">{error}</p>}

      <Button className="w-full" disabled={pending || !current || !password} onClick={submit}>
        {pending ? "Güncelleniyor…" : "Şifreyi Değiştir"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-fg-2">{label}</span>
      {children}
    </label>
  );
}
