import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailConfirm } from "@/components/auth/verify-email-confirm";

export const metadata: Metadata = { title: "E-posta Doğrulama — Aura", robots: { index: false } };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell title="E-postanı doğrula" subtitle="Kaydını tamamlamak için gelen kutunu kontrol et.">
        <div className="flex flex-col items-center gap-3 rounded-[16px] border border-border bg-surface p-8 text-center">
          <MailCheck className="h-12 w-12 text-primary" />
          <p className="text-[14px] text-fg-2">
            Sana bir doğrulama bağlantısı gönderdik. E-postandaki bağlantıya tıklayarak hesabını etkinleştir.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="E-postanı doğrula" subtitle="Son bir adım kaldı.">
      <VerifyEmailConfirm token={token} />
    </AuthShell>
  );
}
