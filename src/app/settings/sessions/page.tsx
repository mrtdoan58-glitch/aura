import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { getAuthService } from "@/server/auth/container";
import { getSessionToken } from "@/server/auth/cookies";
import { SessionList } from "@/components/auth/session-list";

export const metadata: Metadata = { title: "Oturum Yönetimi — Aura" };

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const svc = getAuthService();
  const sessions = await svc.listSessions(user.id);
  const token = await getSessionToken();
  const current = token ? await svc.getValidSessionByToken(token) : null;

  return (
    <div className="mx-auto max-w-[560px] px-5 py-8">
      <h1 className="text-[22px] font-extrabold tracking-tight text-fg">Güvenlik &amp; Oturumlar</h1>
      <p className="mb-6 mt-1 text-[14px] text-fg-2">
        Hesabına bağlı cihazları gör ve şüpheli oturumları sonlandır.
      </p>
      <SessionList sessions={sessions} currentId={current?.id ?? null} />
    </div>
  );
}
