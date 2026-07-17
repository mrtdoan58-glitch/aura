"use client";

import { useEffect, useRef } from "react";

/** Sonsuz kaydırma için sentinel gözlemi. Görünür olunca callback tetiklenir. */
export function useIntersection(onIntersect: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect, enabled]);
  return ref;
}
