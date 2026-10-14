"use client";

import { useSyncExternalStore } from "react";

// The buyer's shortlist, kept in this browser until accounts land (Supabase).
const KEY = "betterimmo:shortlist";
const listeners = new Set<() => void>();
let cache: string[] | null = null;
const EMPTY: string[] = [];

function read(): string[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache!;
}

function write(ids: string[]) {
  cache = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Private mode or storage full: keep it in memory for this visit.
  }
  listeners.forEach((l) => l());
}

export function toggleShortlist(id: string) {
  const ids = read();
  write(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
}

export function useShortlist(): string[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}
