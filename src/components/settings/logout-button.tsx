"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/auth-actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-[14.5px] font-bold text-danger transition-colors hover:bg-surface-2"
      >
        <LogOut className="h-[18px] w-[18px]" /> Çıkış Yap
      </button>
    </form>
  );
}
