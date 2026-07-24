"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, BadgeCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ErrorState } from "@/components/feed/states";
import { useThread } from "@/hooks/use-thread";
import { useHaptic } from "@/hooks/use-haptic";
import { cn } from "@/lib/utils";

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { query, send } = useThread(id);
  const [text, setText] = useState("");
  const haptic = useHaptic();
  const bodyRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const data = query.data;
  const messages = data ? [...data.messages].reverse() : []; // API DESC → gösterim ASC

  // Thread yüklenince (okundu işaretlendi) liste rozetini tazele.
  useEffect(() => {
    if (data) qc.invalidateQueries({ queryKey: ["conversations"] });
  }, [data, qc]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages.length]);

  const submit = () => {
    const v = text.trim();
    if (!v || send.isPending) return;
    setText("");
    haptic();
    send.mutate(v);
  };

  if (query.isError) {
    return (
      <div className="mx-auto flex h-screen max-w-[500px] flex-col justify-center px-6">
        <ErrorState onRetry={() => query.refetch()} />
        <Link href="/messages" className="mt-4 text-center text-[13px] font-semibold text-primary">
          Mesajlara dön
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-screen max-w-[500px] flex-col">
      <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/messages" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Geri">
          <ArrowLeft className="h-[23px] w-[23px]" />
        </Link>
        {data ? (
          <Link href={`/profile/${data.otherUser.username}`} className="flex flex-1 items-center gap-3">
            <Avatar src={data.otherUser.avatarUrl} size={40} />
            <div className="flex items-center gap-1 text-[15px] font-bold">
              {data.otherUser.name}
              {data.otherUser.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
            </div>
          </Link>
        ) : (
          <div className="flex flex-1 items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        )}
      </header>

      <div ref={bodyRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {query.isLoading ? (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("skeleton h-10 rounded-[20px]", i % 2 ? "w-1/2 self-end" : "w-2/3 self-start")} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="m-auto text-center text-[13px] text-fg-3">Henüz mesaj yok. İlk mesajı sen gönder.</div>
        ) : (
          messages.map((m) => {
            const mine = data ? m.senderId !== data.otherUser.id : false;
            return (
              <div
                key={m.id}
                className={cn(
                  "max-w-[74%] rounded-[20px] px-4 py-2.5 text-sm leading-snug",
                  mine ? "self-end rounded-br-md bg-primary text-white" : "self-start rounded-bl-md bg-surface-2 text-fg"
                )}
              >
                {m.text}
                <div className="mt-1 text-right text-[10.5px] opacity-60">{clock(m.createdAt)}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="glass flex items-center gap-2 border-t border-border px-3.5 pb-6 pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Mesaj yaz..."
          className="flex-1 rounded-full bg-surface-2 px-4 py-3 text-[14.5px] outline-none placeholder:text-fg-3"
        />
        <button
          onClick={submit}
          disabled={!text.trim() || send.isPending}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white shadow-[0_6px_16px_var(--ring)] active:scale-90 disabled:opacity-40"
          aria-label="Gönder"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
