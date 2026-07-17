"use client";

import { useCallback } from "react";
import { useFeed } from "@/hooks/use-feed";
import { useIntersection } from "@/hooks/use-intersection";
import { PostCard } from "@/components/feed/post-card";
import { PostSkeleton, EmptyState, ErrorState } from "@/components/feed/states";

export function FeedList() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();

  const onIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const sentinel = useIntersection(onIntersect, Boolean(hasNextPage));

  if (isLoading)
    return (
      <div className="px-4">
        {[0, 1].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );

  if (isError)
    return (
      <div className="px-4">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );

  const posts = data?.pages.flatMap((p) => p.items) ?? [];
  if (posts.length === 0)
    return (
      <div className="px-4">
        <EmptyState title="Akışın boş" hint="Takip ettiklerin paylaştıkça burada görünür." />
      </div>
    );

  return (
    <div className="px-4">
      {posts.map((post, i) => (
        <PostCard key={post.id} post={post} priority={i === 0} />
      ))}
      {isFetchingNextPage && <PostSkeleton />}
      <div ref={sentinel} className="h-4" aria-hidden />
      {!hasNextPage && posts.length > 0 && (
        <p className="py-6 text-center text-[13px] font-medium text-fg-3">Hepsi bu kadar ✨</p>
      )}
    </div>
  );
}
