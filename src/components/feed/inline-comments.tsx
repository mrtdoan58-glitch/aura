"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Send, Loader2 } from "lucide-react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useComments } from "@/hooks/use-comments";
import { addCommentAction } from "@/server/actions/feed-actions";
import type { CommentDTO, CursorPageDTO } from "@/lib/feed/types";
import { Avatar } from "@/components/ui/avatar";
import { relativeTime } from "@/lib/feed/format";
import { EmptyState } from "@/components/feed/states";

type CommentsData = InfiniteData<CursorPageDTO<CommentDTO>>;

/** Post-detay sayfasında kalıcı satır-içi yorumlar (feed'deki alt-sayfanın aksine). */
export function InlineComments({ postId, canComment }: { postId: string; canComment: boolean }) {
  const query = useComments(postId, true);
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
    <section className="border-t border-border">
      <h2 className="px-5 pb-1 pt-4 text-[12px] font-extrabold uppercase tracking-wider text-fg-3">Yorumlar</h2>

      <div className="px-5 pb-4">
        {query.isLoading ? (
          <CommentSkeleton />
        ) : query.isError ? (
          <EmptyState title="Yorumlar yüklenemedi" hint="Lütfen tekrar dene." />
        ) : comments.length === 0 ? (
          <EmptyState title="Henüz yorum yok" hint={canComment ? "İlk yorumu sen yaz." : "Giriş yaparak ilk yorumu yazabilirsin."} />
        ) : (
          <>
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 py-2.5">
                <Link href={`/profile/${c.author.username}`} className="shrink-0">
                  <Avatar src={c.author.avatarUrl} size={36} />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] leading-snug">
                    <Link href={`/profile/${c.author.username}`} className="mr-1.5 font-bold hover:underline">
                      {c.author.username}
                    </Link>
                    {c.text}
                  </p>
                  <span className="text-[11.5px] text-fg-3">{relativeTime(c.createdAt)}</span>
                </div>
              </div>
            ))}
            {query.hasNextPage && (
              <button onClick={() => query.fetchNextPage()} className="mt-2 block text-[13px] font-semibold text-primary">
                Daha fazla yükle
              </button>
            )}
          </>
        )}
      </div>

      {error && <p className="px-5 pb-1 text-[12.5px] text-danger">{error}</p>}

      {canComment ? (
        <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-bg p-3 pb-6">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Yorum ekle..."
            aria-label="Yorum metni"
            className="flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-[14px] outline-none placeholder:text-fg-3"
          />
          <button
            onClick={submit}
            disabled={pending || !text.trim()}
            className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white disabled:opacity-50"
            aria-label="Gönder"
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      ) : (
        <div className="border-t border-border p-4 pb-6 text-center text-[13px] text-fg-3">
          Yorum yapmak için{" "}
          <Link href="/login" className="font-semibold text-primary">
            giriş yap
          </Link>
        </div>
      )}
    </section>
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
