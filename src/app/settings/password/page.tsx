import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/server/auth/current-user";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

export const metadata: Metadata = { title: "Şifre Değiştir — Aura" };

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-[560px] px-5 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/settings" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Geri">
          <ArrowLeft className="h-[22px] w-[22px]" />
        </Link>
        <h1 className="text-[22px] font-extrabold tracking-tight">Şifre Değiştir</h1>
      </header>
      <ChangePasswordForm />
    </div>
  );
}
