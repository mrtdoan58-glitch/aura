"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { MediaDTO } from "@/lib/feed/types";
import { cn } from "@/lib/utils";

/** Çoklu medya carousel'i: yatay snap-scroll, nokta göstergesi, görsel optimizasyonu, video altyapısı. */
export function MediaCarousel({
  media,
  onDoubleTap,
  priority,
}: {
  media: MediaDTO[];
  onDoubleTap?: () => void;
  priority?: boolean;
}) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setActive((prev) => (prev === next ? prev : next)); // yalnızca değişince re-render
  };

  return (
    <div className="relative aspect-[4/5] bg-surface-2" onDoubleClick={onDoubleTap}>
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {media.map((m, i) => (
          <div key={m.id} className="relative h-full w-full flex-shrink-0 snap-center">
            {m.type === "video" ? (
              <video
                src={m.url}
                poster={m.posterUrl ?? undefined}
                className="h-full w-full object-cover"
                controls
                playsInline
                preload="none"
              />
            ) : (
              <Image
                src={m.url}
                alt=""
                fill
                sizes="(max-width: 500px) 100vw, 500px"
                className="object-cover"
                placeholder={m.blurDataUrl ? "blur" : "empty"}
                blurDataURL={m.blurDataUrl ?? undefined}
                priority={Boolean(priority) && i === 0}
              />
            )}
          </div>
        ))}
      </div>

      {media.length > 1 && (
        <>
          <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
            {active + 1}/{media.length}
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {media.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === active ? "w-1.5 bg-white" : "w-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
