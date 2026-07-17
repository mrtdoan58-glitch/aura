import Link from "next/link";
import type { Metadata } from "next";
import { ensureCsrfToken } from "@/server/auth/cookies";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Şifremi Unuttum — Aura", robots: { index: false } };

export default async function ForgotPasswordPage() {
  const csrf = await ensureCsrfToken();
  return (
    <AuthShell
      title="Şifreni mi unuttun?"
      subtitle="E-postanı gir, sana bir sıfırlama bağlantısı gönderelim."
      footer={
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Giriş sayfasına dön
        </Link>
      }
    >
      <ForgotForm csrf={csrf} />
    </AuthShell>
  );
}
