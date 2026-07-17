import Link from "next/link";
import type { Metadata } from "next";
import { ensureCsrfToken } from "@/server/auth/cookies";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Kayıt Ol — Aura", robots: { index: false } };

export default async function RegisterPage() {
  const csrf = await ensureCsrfToken();
  return (
    <AuthShell
      title="Aura'ya katıl"
      subtitle="Birkaç saniyede ücretsiz hesabını oluştur."
      footer={
        <>
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Giriş yap
          </Link>
        </>
      }
    >
      <RegisterForm csrf={csrf} />
    </AuthShell>
  );
}
