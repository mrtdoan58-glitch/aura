"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Video, Smile, Paperclip, ImageIcon, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { conversations, getMessages } from "@/lib/dummy-data";
import type { Message } from "@/types";
import { useHaptic } from "@/hooks/use-haptic";
import { cn } from "@/lib/utils";

const REPLIES = ["Kesinlikle!", "Harika fikir", "Bunu deneyelim", "Çok iyi düşünmüşsün", "Bana da uyar"];

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const convo = conversations.find((c) => c.id === id) ?? conversations[0];
  const [messages, setMessages] = useState<Message[]>(() => getMessages(id));
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const haptic = useHaptic();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages, typing]);

  const send = () => {
    const v = text.trim();
    if (!v) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages((m) => [...m, { id: `s${Date.now()}`, from: "me", text: v, time }]);
    setText("");
    haptic();
    setTimeout(() => setTyping(true), 500);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: `r${Date.now()}`, from: "them", text: REPLIES[Math.floor(Math.random() * REPLIES.length)], time },
      ]);
    }, 1900);
  };

  return (
    <div className="mx-auto flex h-screen max-w-[500px] flex-col">
      <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/messages" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Geri">
          <ArrowLeft className="h-[23px] w-[23px]" />
        </Link>
        <Avatar src={convo.user.avatar} size={40} />
        <div className="flex-1">
          <div className="text-[15px] font-bold">{convo.user.name}</div>
          <div className="text-xs font-semibold text-success">çevrimiçi</div>
        </div>
        <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Sesli arama">
          <Phone className="h-[21px] w-[21px]" />
        </button>
        <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Görüntülü arama">
          <Video className="h-[21px] w-[21px]" />
        </button>
      </header>

      <div ref={bodyRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        <div className="my-1.5 text-center text-[11.5px] font-semibold text-fg-3">Bugün</div>
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[74%] rounded-[20px] px-4 py-2.5 text-sm leading-snug",
              m.from === "me"
                ? "self-end rounded-br-md bg-primary text-white"
                : "self-start rounded-bl-md bg-surface-2 text-fg"
            )}
          >
            {m.text}
            <div className="mt-1 text-right text-[10.5px] opacity-60">
              {m.time}
              {m.from === "me" && " · ✓✓"}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-1 self-start rounded-[20px] rounded-bl-md bg-surface-2 px-4 py-3.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-[7px] w-[7px] rounded-full bg-fg-3"
                style={{ animation: `blink 1.4s infinite`, animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="glass flex items-center gap-2 border-t border-border px-3.5 pb-6 pt-3">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2.5">
          <Smile className="h-5 w-5 text-fg-2" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Mesaj yaz..."
            className="flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-fg-3"
          />
          <Paperclip className="h-5 w-5 text-fg-2" />
          <ImageIcon className="h-5 w-5 text-fg-2" />
        </div>
        <button onClick={send} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white shadow-[0_6px_16px_var(--ring)] active:scale-90" aria-label="Gönder">
          <Send className="h-5 w-5" />
        </button>
      </div>
      <style>{`@keyframes blink{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}`}</style>
    </div>
  );
}
