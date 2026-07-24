"use client";

import { Fragment, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, BadgeCheck, ImageIcon, SmilePlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ErrorState } from "@/components/feed/states";
import { useThread } from "@/hooks/use-thread";
import { useHaptic } from "@/hooks/use-haptic";
import { cn } from "@/lib/utils";

const REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { query, send, sendImage, react } = useThread(id);
  const [text, setText] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const haptic = useHaptic();
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const applyReaction = (messageId: string, emoji: string, alreadyMine: boolean) => {
    haptic();
    setPickerFor(null);
    react.mutate({ messageId, emoji: alreadyMine ? null : emoji });
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    haptic();
    sendImage.mutate(file);
  };

  const data = query.data;
  const messages = data ? [...data.messages].reverse() : []; // API DESC → gösterim ASC

  // Okundu bilgisi: karşı tarafın okuduğu son "benim" mesajım (altına "Görüldü").
  const seenUntil = data?.otherLastReadAt ? new Date(data.otherLastReadAt).getTime() : 0;
  let lastSeenMineId: string | null = null;
  if (data) {
    for (const m of messages) {
      if (m.senderId !== data.otherUser.id && new Date(m.createdAt).getTime() <= seenUntil) lastSeenMineId = m.id;
    }
  }

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
              <Fragment key={m.id}>
              <div className={cn("group flex max-w-[86%] items-center gap-1.5", mine ? "flex-row-reverse self-end" : "self-start")}>
                <div
                  className={cn(
                    "overflow-hidden rounded-[20px] text-sm leading-snug",
                    m.imageUrl ? "p-1" : "px-4 py-2.5",
                    mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-surface-2 text-fg"
                  )}
                >
                  {m.imageUrl && (
                    <Image
                      src={m.imageUrl}
                      alt={m.text || "Fotoğraf"}
                      width={240}
                      height={240}
                      className="h-auto w-full max-w-[240px] rounded-[16px] object-cover"
                      unoptimized
                    />
                  )}
                  {m.text && <div className={cn(m.imageUrl && "px-3 pb-1 pt-1.5")}>{m.text}</div>}
                  <div className={cn("text-right text-[10.5px] opacity-60", m.imageUrl ? "px-3 pb-1" : "mt-1")}>
                    {clock(m.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => setPickerFor((v) => (v === m.id ? null : m.id))}
                  className="shrink-0 text-fg-3 opacity-0 transition-opacity hover:text-fg-2 focus:opacity-100 group-hover:opacity-100 aria-expanded:opacity-100"
                  aria-label="Tepki ver"
                  aria-expanded={pickerFor === m.id}
                >
                  <SmilePlus className="h-[18px] w-[18px]" />
                </button>
              </div>

              {pickerFor === m.id && (
                <div className={cn("flex gap-0.5 rounded-full border border-border bg-bg px-2 py-1 shadow-md", mine ? "self-end" : "self-start")}>
                  {REACTIONS.map((e) => {
                    const alreadyMine = m.reactions.find((r) => r.emoji === e)?.mine ?? false;
                    return (
                      <button
                        key={e}
                        onClick={() => applyReaction(m.id, e, alreadyMine)}
                        className={cn("rounded-full px-1 text-[19px] transition-transform hover:scale-125", alreadyMine && "bg-primary/15")}
                      >
                        {e}
                      </button>
                    );
                  })}
                </div>
              )}

              {m.reactions.length > 0 && (
                <div className={cn("-mt-1 flex flex-wrap gap-1", mine ? "self-end" : "self-start")}>
                  {m.reactions.map((r) => (
                    <button
                      key={r.emoji}
                      onClick={() => applyReaction(m.id, r.emoji, r.mine)}
                      className={cn(
                        "flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[12px]",
                        r.mine ? "border-primary bg-primary/10" : "border-border bg-surface-2"
                      )}
                    >
                      <span>{r.emoji}</span>
                      <span className="font-semibold text-fg-2">{r.count}</span>
                    </button>
                  ))}
                </div>
              )}

              {m.id === lastSeenMineId && (
                <div className="-mt-1 self-end pr-1 text-[10.5px] font-medium text-fg-3">Görüldü</div>
              )}
              </Fragment>
            );
          })
        )}
      </div>

      <div className="glass flex items-center gap-2 border-t border-border px-3.5 pb-6 pt-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={sendImage.isPending}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-fg-2 hover:bg-surface-2 disabled:opacity-40"
          aria-label="Fotoğraf gönder"
        >
          <ImageIcon className="h-[22px] w-[22px]" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={sendImage.isPending ? "Fotoğraf yükleniyor…" : "Mesaj yaz..."}
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
