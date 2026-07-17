"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useComments } from "@/hooks/use-comments";
import { addCommentAction } from "@/server/actions/feed-actions";
import type { CommentDTO, CursorPageDTO } from "@/lib/feed/types";
import { Avatar } from "@/components/ui/avatar";
import { relativeTime } from "@/lib/feed/format";
import { EmptyState } from "@/components/feed/states";

type CommentsData = InfiniteData<CursorPageDTO<CommentDTO>>;

export function CommentsSheet({ postId, open, onClose }: { postId: string; open: boolean; onClose: () => void }) {
  const query = useComments(postId, open);
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    setError(null);
    startTransition(async () => {
      const res = await addCommentAction(postId, value);
      if (res.ok && res.data) {
        // Optimistic: doğruluk kaynağı olan cache'in ilk sayfasına ekle (tekrar riski yok)
        qc.setQueryData<CommentsData>(["comments", postId], (d) => {
          if (!d) return d;
          const [first, ...rest] = d.pages;
          const firstPage = first ?? { items: [], nextCursor: null };
          return { ...d, pages: [{ ...firstPage, items: [res.data as CommentDTO, ...firstPage.items] }, ...rest] };
        });
      } else {
        setError(res.error ?? "Yorum gönderilemedi");
      }
    });
  };

  const comments = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-black/40" />
          <motion.div
            role="dialog"
            aria-label="Yorumlar"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[61] mx-auto flex max-h-[80vh] max-w-[500px] flex-col rounded-t-[24px] bg-bg"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-[15px] font-bold">Yorumlar</h2>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Kapat">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {query.isLoading && <CommentSkeleton />}
              {query.isError && <EmptyState title="Yorumlar yüklenemedi" hint="Lütfen tekrar dene." />}
              {!query.isLoading && !query.isError && comments.length === 0 && (
                <EmptyState title="Henüz yorum yok" hint="İlk yorumu sen yaz." />
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3 py-2.5">
                  <Avatar src={c.author.avatarUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] leading-snug">
                      <b className="mr-1.5 font-bold">{c.author.username}</b>
                      {c.text}
                    </p>
                    <span className="text-[11.5px] text-fg-3">{relativeTime(c.createdAt)}</span>
                  </div>
                </div>
              ))}
              {query.hasNextPage && (
                <button onClick={() => query.fetchNextPage()} className="mx-auto mt-2 block text-[13px] font-semibold text-primary">
                  Daha fazla yükle
                </button>
              )}
            </div>

            {error && <p className="px-5 pb-1 text-[12.5px] text-danger">{error}</p>}
            <div className="flex items-center gap-2 border-t border-border p-3 pb-6">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Yorum ekle..."
                aria-label="Yorum metni"
                className="flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-[14px] outline-none placeholder:text-fg-3"
              />
              <button onClick={submit} disabled={pending || !text.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white disabled:opacity-50" aria-label="Gönder">
                {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommentSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
