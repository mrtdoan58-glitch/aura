"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SearchResultsDTO } from "@/lib/search/types";

async function fetchSearch(q: string): Promise<SearchResultsDTO> {
  const url = new URL("/api/search", window.location.origin);
  url.searchParams.set("q", q);
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Arama başarısız");
  return res.json();
}

/** Sorguyu 300ms debounce'lar; en az 1 karakterde arar. */
export function useSearch(query: string) {
  const [debounced, setDebounced] = useState(query.trim());
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const enabled = debounced.length >= 1;
  const query_ = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => fetchSearch(debounced),
    enabled,
  });

  return { query: query_, debounced, enabled };
}
