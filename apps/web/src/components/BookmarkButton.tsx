"use client";
import { useEffect, useState } from "react";
import useSWR, { mutate as swrMutate } from "swr";
import { apiGet, apiPost, getApiBase } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function BookmarkButton({ slug, className, activeClassName }: { slug: string; className?: string; activeClassName?: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageKey = "bk_slugs";

  // Instant state from last-known localStorage snapshot
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey) || "[]";
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) setBookmarked(arr.includes(slug));
    } catch {}
  }, [slug]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    // Fast path: try to read bookmark slugs in parallel once token available; otherwise fall back to item endpoint
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, async (u) => {
        try {
          if (!u?.uid) return;
          // fetch user slugs list once and set state from it (instant)
          const list = await apiGet<{ slugs: string[] }>(`/users/me/bookmarks/slugs`);
          const slugs = Array.isArray(list.slugs) ? list.slugs : [];
          // persist snapshot and seed SWR cache for other consumers
          try { localStorage.setItem(storageKey, JSON.stringify(slugs)); } catch {}
          setBookmarked(slugs.includes(slug));
          swrMutate(`/users/me/bookmarks/slugs`, { slugs }, { revalidate: false });
        } catch {
          // fallback: fetch item bookmark state anonymously
          fetch(`${getApiBase()}/articles/${slug}/bookmark`, { headers: { "Content-Type": "application/json" }, cache: "no-store" })
            .then(async (res) => { if (!res.ok) throw new Error("fail"); return (await res.json()) as { bookmarked: boolean }; })
            .then((r) => setBookmarked(Boolean(r.bookmarked)))
            .catch(() => setBookmarked(false));
        }
      });
    } catch {}
    return () => { if (unsub) unsub(); };
  }, [slug]);

  async function toggle() {
    setSending(true);
    try {
      setError(null);
      const auth = getFirebaseAuth();
      const uid = auth.currentUser?.uid;
      const headers: HeadersInit | undefined = uid ? { "X-User-Id": uid } : undefined;
      // optimistic
      setBookmarked((v) => !v);
      // update local snapshot and SWR caches immediately
      try {
        const raw = localStorage.getItem(storageKey) || "[]";
        const arr: string[] = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        const next = (arr.includes(slug) ? arr.filter(s => s !== slug) : [...arr, slug]);
        localStorage.setItem(storageKey, JSON.stringify(next));
        swrMutate(`/users/me/bookmarks/slugs`, { slugs: next }, { revalidate: false });
        // trigger background refresh of full bookmarks list
        void swrMutate(`/users/me/bookmarks`);
      } catch {}
      const r = await apiPost<{ bookmarked: boolean }>(`/articles/${slug}/bookmark`, uid ? { user_id: uid } : {}, headers ? { headers } : undefined);
      setBookmarked(Boolean(r.bookmarked));
    } catch (e) {
      setError("Требуется вход");
      // rollback
      setBookmarked((v) => !v);
      try {
        const raw = localStorage.getItem(storageKey) || "[]";
        const arr: string[] = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        const next = (arr.includes(slug) ? arr.filter(s => s !== slug) : [...arr, slug]);
        localStorage.setItem(storageKey, JSON.stringify(next));
        swrMutate(`/users/me/bookmarks/slugs`, { slugs: next }, { revalidate: false });
      } catch {}
    } finally {
      setSending(false);
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={sending} title={bookmarked ? "В закладках" : "Добавить в закладки"} className={`${className || ""} ${bookmarked ? (activeClassName || "") : ""}`.trim()}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M6 2a2 2 0 0 0-2 2v18l8-5.33L20 22V4a2 2 0 0 0-2-2H6z" />
      </svg>
    </button>
  );
}


