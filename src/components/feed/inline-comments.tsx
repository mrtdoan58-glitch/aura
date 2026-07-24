"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Send, Loader2, X } from "lucide-react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useComments } from "@/hooks/use-comments";
import { useReplies } from "@/hooks/use-replies";
import { addCommentAction } from "@/server/actions/feed-actions";
import type { CommentDTO, CursorPageDTO } from "@/lib/feed/types";
import { Avatar } from "@/components/ui/avatar";
import { relativeTime } from "@/lib/feed/format";
import { EmptyState } from "@/components/feed/states";

type CommentsData = InfiniteData<CursorPageDTO<CommentDTO>>;
type RepliesData = { items: CommentDTO[] };

/** Post-detay sayfasında kalıcı satır-içi yorumlar + tek seviye yanıtlar. */
export function InlineComments({ postId, canComment }: { postId: string; canComment: boolean }) {
  const query = useComments(postId, true);
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    const parent = replyTo;
    setText("");
    setError(null);
    startTransition(async () => {
      const res = await addCommentAction(postId, value, parent?.id ?? null);
      if (res.ok && res.data) {
        const created = res.data;
        if (parent) {
          // Yanıt: parent'ın yanıt cache'ine ekle + replyCount'u artır.
          qc.setQueryData<RepliesData>(["replies", parent.id], (d) => (d ? { items: [...d.items, created] } : d));
          qc.setQueryData<CommentsData>(["comments", postId], (d) =>
            d
              ? { ...d, pages: d.pages.map((pg) => ({ ...pg, items: pg.items.map((c) => (c.id === parent.id ? { ...c, replyCount: c.replyCount + 1 } : c)) })) }
              : d
          );
          setReplyTo(null);
        } else {
          qc.setQueryData<CommentsData>(["comments", postId], (d) => {
            if (!d) return d;
            const [first, ...rest] = d.pages;
            const firstPage = first ?? { items: [], nextCursor: null };
            return { ...d, pages: [{ ...firstPage, items: [created, ...firstPage.items] }, ...rest] };
          });
        }
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
              <CommentRow key={c.id} comment={c} canComment={canComment} onReply={(t) => setReplyTo(t)} />
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
        <div className="sticky bottom-0 border-t border-border bg-bg p-3 pb-6">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between px-1 text-[12.5px] text-fg-3">
              <span>
                <b className="font-semibold text-fg-2">@{replyTo.username}</b> kullanıcısına yanıt
              </span>
              <button onClick={() => setReplyTo(null)} aria-label="Yanıtı iptal et" className="text-fg-3 hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={replyTo ? "Yanıtını yaz..." : "Yorum ekle..."}
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

function CommentRow({
  comment: c,
  canComment,
  onReply,
}: {
  comment: CommentDTO;
  canComment: boolean;
  onReply: (t: { id: string; username: string }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const repliesQuery = useReplies(c.id, expanded);
  const replies = repliesQuery.data?.items ?? [];

  return (
    <div className="py-2.5">
      <div className="flex gap-3">
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
          <div className="mt-0.5 flex items-center gap-3 text-[11.5px] text-fg-3">
            <span>{relativeTime(c.createdAt)}</span>
            {canComment && (
              <button onClick={() => onReply({ id: c.id, username: c.author.username })} className="font-semibold hover:text-fg-2">
                Yanıtla
              </button>
            )}
          </div>

          {c.replyCount > 0 && (
            <button onClick={() => setExpanded((v) => !v)} className="mt-1.5 text-[12px] font-semibold text-fg-3 hover:text-fg-2">
              {expanded ? "Yanıtları gizle" : `${c.replyCount} yanıtı gör`}
            </button>
          )}

          {expanded && (
            <div className="mt-2 space-y-2.5 border-l-2 border-border pl-3">
              {repliesQuery.isLoading ? (
                <div className="text-[12px] text-fg-3">Yükleniyor…</div>
              ) : (
                replies.map((r) => (
                  <div key={r.id} className="flex gap-2.5">
                    <Link href={`/profile/${r.author.username}`} className="shrink-0">
                      <Avatar src={r.author.avatarUrl} size={28} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug">
                        <Link href={`/profile/${r.author.username}`} className="mr-1.5 font-bold hover:underline">
                          {r.author.username}
                        </Link>
                        {r.text}
                      </p>
                      <span className="text-[11px] text-fg-3">{relativeTime(r.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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
