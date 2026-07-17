import Link from "next/link";
import type { Metadata } from "next";
import { ensureCsrfToken } from "@/server/auth/cookies";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Giriş Yap — Aura", robots: { index: false } };

export default async function LoginPage() {
  const csrf = await ensureCsrfToken();
  return (
    <AuthShell
      title="Tekrar hoş geldin"
      subtitle="Hesabına giriş yap ve kaldığın yerden devam et."
      footer={
        <>
          Hesabın yok mu?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Kayıt ol
          </Link>
        </>
      }
    >
      <LoginForm csrf={csrf} />
    </AuthShell>
  );
}
