import type { Metadata } from "next";
import Link from "next/link";
import { ensureCsrfToken } from "@/server/auth/cookies";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Şifre Sıfırla — Aura", robots: { index: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const csrf = await ensureCsrfToken();

  if (!token)
    return (
      <AuthShell title="Geçersiz bağlantı" subtitle="Sıfırlama bağlantısı eksik ya da hatalı.">
        <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
          Yeni bağlantı iste
        </Link>
      </AuthShell>
    );

  return (
    <AuthShell title="Yeni şifre belirle" subtitle="Güçlü ve benzersiz bir şifre seç.">
      <ResetForm csrf={csrf} token={token} />
    </AuthShell>
  );
}
