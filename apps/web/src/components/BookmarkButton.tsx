"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, getApiBase } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function BookmarkButton({ slug, className, activeClassName }: { slug: string; className?: string; activeClassName?: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    // Fast path: fetch immediately without waiting for Firebase Auth init
    fetch(`${getApiBase()}/articles/${slug}/bookmark`, { headers: { "Content-Type": "application/json" }, cache: "no-store" })
      .then(async (res) => { if (!res.ok) throw new Error("fail"); return (await res.json()) as { bookmarked: boolean }; })
      .then((r) => setBookmarked(Boolean(r.bookmarked)))
      .catch(() => setBookmarked(false));
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, async (u) => {
        try {
          if (!u?.uid) return; // already have anonymous state
          const headers: HeadersInit = { "X-User-Id": u.uid };
          const r = await apiGet<{ bookmarked: boolean }>(`/articles/${slug}/bookmark`, { headers });
          setBookmarked(Boolean(r.bookmarked));
        } catch {
          // keep anonymous state
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
      const r = await apiPost<{ bookmarked: boolean }>(`/articles/${slug}/bookmark`, uid ? { user_id: uid } : {}, headers ? { headers } : undefined);
      setBookmarked(Boolean(r.bookmarked));
    } catch (e) {
      setError("Требуется вход");
      // rollback
      setBookmarked((v) => !v);
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


