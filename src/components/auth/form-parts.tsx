"use client";

import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormBanner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "mb-4 flex items-start gap-2.5 rounded-[14px] border px-4 py-3 text-[13.5px] font-medium",
        type === "success"
          ? "border-success/30 bg-success/10 text-success"
          : "border-danger/30 bg-danger/10 text-danger"
      )}
    >
      {type === "success" ? (
        <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-[15px] font-bold text-white shadow-[0_8px_20px_var(--ring)] transition-all active:scale-[0.98] disabled:opacity-60"
    >
      {pending && <Loader2 className="h-[18px] w-[18px] animate-spin" />}
      {children}
    </button>
  );
}
