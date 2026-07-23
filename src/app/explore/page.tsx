"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Layers } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, ErrorState } from "@/components/feed/states";
import { useExplore } from "@/hooks/use-explore";
import { useIntersection } from "@/hooks/use-intersection";
import { formatCount } from "@/lib/feed/format";

export default function ExplorePage() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useExplore();

  const onIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const sentinel = useIntersection(onIntersect, Boolean(hasNextPage));

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 border-b border-border px-5 py-3.5">
          <h1 className="text-[19px] font-extrabold tracking-tight">Keşfet</h1>
        </header>

        {isLoading ? (
          <div className="columns-2 gap-2.5 px-4 pt-3.5 pb-4 [column-gap:10px]">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="skeleton mb-2.5 w-full rounded-2xl"
                style={{ height: 150 + (i % 4) * 40 }}
              />
            ))}
          </div>
        ) : isError ? (
          <div className="px-4 py-6">
            <ErrorState onRetry={() => refetch()} />
          </div>
        ) : posts.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState title="Henüz keşfedilecek bir şey yok" hint="Paylaşımlar arttıkça en beğenilenler burada görünür." />
          </div>
        ) : (
          <>
            <div className="columns-2 gap-2.5 px-4 pt-3.5 pb-4 [column-gap:10px]">
              {posts.map((post) => {
                const media = post.media[0];
                return (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="group relative mb-2.5 block w-full overflow-hidden rounded-2xl bg-surface-2"
                  >
                    <Image
                      src={media?.url}
                      alt={post.caption?.slice(0, 60) ?? ""}
                      width={media?.width || 500}
                      height={media?.height || 500}
                      sizes="250px"
                      className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {post.media.length > 1 && (
                      <span className="absolute right-2.5 top-2.5 text-white drop-shadow">
                        <Layers className="h-[18px] w-[18px]" fill="white" />
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
                        <Heart className="h-4 w-4" fill="white" /> {formatCount(post.likeCount)}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <div ref={sentinel} className="h-6" aria-hidden />
          </>
        )}
      </div>
    </AppShell>
  );
}
