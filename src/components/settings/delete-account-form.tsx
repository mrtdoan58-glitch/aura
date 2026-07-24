"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { deleteAccountAction } from "@/server/actions/settings-actions";

export function DeleteAccountForm({ username }: { username: string }) {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canDelete = password.length > 0 && confirmText.trim().toLowerCase() === username.toLowerCase();

  const submit = () => {
    if (!canDelete) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteAccountAction(password);
      if (res.ok) {
        // Oturum kapandı; tam yeniden yükleme ile ana sayfaya dön.
        window.location.href = "/";
      } else {
        setError(res.error ?? "Hesap silinemedi.");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-2xl border border-danger/40 bg-danger/5 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
        <div className="text-[13.5px] leading-relaxed text-fg-2">
          <p className="font-bold text-danger">Bu işlem geri alınamaz.</p>
          <p className="mt-1">
            Hesabın, tüm gönderilerin, hikayelerin, yorumların, beğenilerin, takip ilişkilerin ve mesajların kalıcı olarak silinir.
          </p>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-fg-2">Onaylamak için kullanıcı adını yaz: <span className="text-fg">@{username}</span></span>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={username}
          autoCapitalize="none"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[14.5px] outline-none focus:border-danger"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-fg-2">Şifren</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[14.5px] outline-none focus:border-danger"
        />
      </label>

      {error && <p className="text-[13.5px] font-medium text-danger">{error}</p>}

      <button
        onClick={submit}
        disabled={!canDelete || pending}
        className="w-full rounded-2xl bg-danger py-3.5 text-[14.5px] font-bold text-white transition-opacity disabled:opacity-40"
      >
        {pending ? "Siliniyor…" : "Hesabımı kalıcı olarak sil"}
      </button>
    </div>
  );
}
