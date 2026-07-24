"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, MoreHorizontal, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import type { PostDTO } from "@/lib/feed/types";
import { Avatar } from "@/components/ui/avatar";
import { MediaCarousel } from "@/components/feed/media-carousel";
import { CommentsSheet } from "@/components/feed/comments-sheet";
import { usePostActions } from "@/hooks/use-post-actions";
import { useUIStore } from "@/store/ui-store";
import { useHaptic } from "@/hooks/use-haptic";
import { relativeTime, formatCount } from "@/lib/feed/format";
import { cn } from "@/lib/utils";

export const PostCard = memo(function PostCard({ post, priority }: { post: PostDTO; priority?: boolean }) {
  const { like, save } = usePostActions();
  const showToast = useUIStore((s) => s.showToast);
  const haptic = useHaptic();
  const [burst, setBurst] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const toggleLike = (next: boolean) => {
    if (next) haptic();
    like.mutate({ postId: post.id, liked: next });
  };
  const doubleTap = () => {
    if (!post.likedByMe) toggleLike(true);
    setBurst(true);
    haptic();
    setTimeout(() => setBurst(false), 900);
  };
  const toggleSave = () => {
    const next = !post.savedByMe;
    save.mutate({ postId: post.id, saved: next });
    showToast(next ? "Kaydedildi" : "Kayıt kaldırıldı");
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Aura", url: `${location.origin}/post/${post.id}` });
      else {
        await navigator.clipboard.writeText(`${location.origin}/post/${post.id}`);
        showToast("Bağlantı kopyalandı");
      }
    } catch {
      /* kullanıcı iptal etti */
    }
  };

  return (
    <article className="mb-5 overflow-hidden rounded-[22px] border border-border bg-bg shadow-soft">
      <header className="flex items-center gap-3 p-3.5">
        <Link href={`/profile/${post.author.username}`} className="shrink-0">
          <Avatar src={post.author.avatarUrl} size={42} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${post.author.username}`} className="flex items-center gap-1.5 text-[14.5px] font-bold hover:underline">
            {post.author.name}
            {post.author.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
          </Link>
          <div className="text-xs font-medium text-fg-3">
            {relativeTime(post.createdAt)}
            {post.location && ` · ${post.location}`}
          </div>
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-full text-fg-2 hover:bg-surface-2" aria-label="Diğer">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      <div className="relative">
        <MediaCarousel media={post.media} onDoubleTap={doubleTap} priority={priority} />
        <AnimatePresence>
          {burst && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.1, 1, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <Heart className="h-24 w-24 text-white drop-shadow-lg" fill="white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1.5 px-3.5 pb-1 pt-3">
        <ActBtn onClick={() => toggleLike(!post.likedByMe)} label={post.likedByMe ? "Beğeniyi kaldır" : "Beğen"} pressed={post.likedByMe}>
          <Heart
            className={cn("h-[23px] w-[23px]", post.likedByMe && "animate-pop")}
            fill={post.likedByMe ? "var(--danger)" : "none"}
            stroke={post.likedByMe ? "var(--danger)" : "currentColor"}
            strokeWidth={1.8}
          />
        </ActBtn>
        <ActBtn onClick={() => setCommentsOpen(true)} label="Yorum yap">
          <MessageCircle className="h-[23px] w-[23px]" strokeWidth={1.8} />
        </ActBtn>
        <ActBtn onClick={share} label="Paylaş">
          <Send className="h-[23px] w-[23px]" strokeWidth={1.8} />
        </ActBtn>
        <span className="flex-1" />
        <ActBtn onClick={toggleSave} label={post.savedByMe ? "Kaydı kaldır" : "Kaydet"} pressed={post.savedByMe}>
          <Bookmark className="h-[23px] w-[23px]" fill={post.savedByMe ? "currentColor" : "none"} strokeWidth={1.8} />
        </ActBtn>
      </div>

      <div className="px-4 pb-4 pt-0.5">
        <div className="mb-1 text-[13.5px] font-bold">{formatCount(post.likeCount)} beğeni</div>
        <p className="text-[13.5px] leading-relaxed">
          <b className="mr-1.5 font-bold">{post.author.username}</b>
          {post.caption}
        </p>
        {post.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Link
                key={t}
                href={`/tags/${encodeURIComponent(t)}`}
                className="text-[12.5px] font-semibold text-primary hover:underline"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
        {post.commentCount > 0 && (
          <button onClick={() => setCommentsOpen(true)} className="mt-2 text-[13px] font-medium text-fg-3">
            {post.commentCount} yorumun tümünü gör
          </button>
        )}
      </div>

      <CommentsSheet postId={post.id} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </article>
  );
});

function ActBtn({
  children,
  onClick,
  label,
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  pressed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="flex items-center gap-1.5 rounded-full p-2 transition-all hover:bg-surface-2 active:scale-90"
    >
      {children}
    </button>
  );
}
