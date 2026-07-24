import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/server/auth/current-user";
import { EditProfileForm } from "@/components/settings/edit-profile-form";

export const metadata: Metadata = { title: "Profili Düzenle — Aura" };

const DEFAULT_AVATAR = "https://i.pravatar.cc/200?img=68";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-[560px] px-5 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/settings" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Geri">
          <ArrowLeft className="h-[22px] w-[22px]" />
        </Link>
        <h1 className="text-[22px] font-extrabold tracking-tight">Profili Düzenle</h1>
      </header>
      <EditProfileForm
        initial={{ name: user.name, username: user.username, avatarUrl: user.avatarUrl ?? DEFAULT_AVATAR }}
      />
    </div>
  );
}
