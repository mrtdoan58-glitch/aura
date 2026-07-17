"use client";

import { useTransition } from "react";
import { Monitor, Smartphone, Tablet, LogOut, ShieldCheck } from "lucide-react";
import type { Session } from "@/server/auth/domain";
import { revokeSessionAction, revokeOtherSessionsAction } from "@/server/actions/session-actions";

function deviceIcon(label: string | null) {
  if (label && /iphone|android/i.test(label)) return Smartphone;
  if (label && /ipad|tablet/i.test(label)) return Tablet;
  return Monitor;
}

export function SessionList({ sessions, currentId }: { sessions: Session[]; currentId: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-fg">Aktif oturumlar</h2>
        <button
          onClick={() => startTransition(() => revokeOtherSessionsAction().then(() => {}))}
          disabled={pending || sessions.length <= 1}
          className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3.5 py-2 text-[13px] font-semibold text-fg transition-all active:scale-95 disabled:opacity-50"
        >
          <ShieldCheck className="h-4 w-4" /> Diğerlerini çıkış yap
        </button>
      </div>
      <ul className="space-y-2.5">
        {sessions.map((s) => {
          const Icon = deviceIcon(s.deviceLabel);
          const isCurrent = s.id === currentId;
          return (
            <li
              key={s.id}
              className="flex items-center gap-3.5 rounded-[16px] border border-border bg-surface p-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-fg-2">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[14px] font-bold text-fg">
                  {s.deviceLabel ?? "Bilinmeyen cihaz"}
                  {isCurrent && (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                      Bu cihaz
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[12.5px] text-fg-3">
                  {s.ipAddress ?? "IP bilinmiyor"} · Son etkinlik{" "}
                  {new Date(s.lastUsedAt).toLocaleDateString("tr-TR")}
                </div>
              </div>
              {!isCurrent && (
                <button
                  onClick={() => startTransition(() => revokeSessionAction(s.id).then(() => {}))}
                  disabled={pending}
                  className="grid h-9 w-9 place-items-center rounded-full text-fg-3 transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label="Oturumu sonlandır"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
