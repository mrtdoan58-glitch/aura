"use client";

import { Inbox, AlertCircle, RefreshCw } from "lucide-react";

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-fg-3">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-[15px] font-bold text-fg">{title}</h3>
      {hint && <p className="max-w-[240px] text-[13.5px] text-fg-2">{hint}</p>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-danger/10 text-danger">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h3 className="text-[15px] font-bold text-fg">Bir şeyler ters gitti</h3>
      <p className="max-w-[240px] text-[13.5px] text-fg-2">İçerik yüklenemedi. Lütfen tekrar dene.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2.5 text-[13.5px] font-semibold text-fg active:scale-95"
        >
          <RefreshCw className="h-4 w-4" /> Tekrar dene
        </button>
      )}
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="mb-5 overflow-hidden rounded-[22px] border border-border">
      <div className="flex items-center gap-3 p-3.5">
        <div className="skeleton h-[42px] w-[42px] rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-2/5 rounded" />
          <div className="skeleton h-3 w-1/4 rounded" />
        </div>
      </div>
      <div className="skeleton aspect-[4/5]" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-3 w-1/4 rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}
