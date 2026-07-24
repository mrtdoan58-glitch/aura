"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import { useTag } from "@/hooks/use-tag";
import { useIntersection } from "@/hooks/use-intersection";
import { EmptyState, ErrorState } from "@/components/feed/states";

export function TagGrid({ tag }: { tag: string }) {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useTag(tag);

  const onIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const sentinel = useIntersection(onIntersect, Boolean(hasNextPage));

  if (isLoading) return <div className="grid grid-cols-3 gap-[3px] p-[3px]">{skeletonTiles()}</div>;
  if (isError)
    return (
      <div className="px-4 py-6">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );

  const posts = data?.pages.flatMap((p) => p.items) ?? [];
  if (posts.length === 0)
    return (
      <div className="px-4 py-10">
        <EmptyState title="Bu etiketle gönderi yok" hint="Bu etiketi kullanan ilk kişi sen olabilirsin." />
      </div>
    );

  return (
    <div className="grid grid-cols-3 gap-[3px] p-[3px]">
      {posts.map((post) => (
        <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square overflow-hidden bg-surface-2">
          <Image src={post.media[0]?.url} alt="" fill sizes="160px" className="object-cover transition-transform active:scale-105" />
          {post.media.length > 1 && (
            <span className="absolute right-2 top-2 text-white drop-shadow">
              <Layers className="h-[17px] w-[17px]" fill="white" />
            </span>
          )}
        </Link>
      ))}
      <div ref={sentinel} className="col-span-3 h-4" aria-hidden />
    </div>
  );
}

function skeletonTiles() {
  return Array.from({ length: 9 }, (_, i) => <div key={i} className="aspect-square animate-pulse bg-surface-2" />);
}
