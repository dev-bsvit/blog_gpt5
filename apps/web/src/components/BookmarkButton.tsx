"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function BookmarkButton({ slug }: { slug: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, async (u) => {
        try {
          const headers: HeadersInit | undefined = u?.uid ? { "X-User-Id": u.uid } : undefined;
          const r = await apiGet<{ bookmarked: boolean }>(`/articles/${slug}/bookmark`, { headers });
          setBookmarked(Boolean(r.bookmarked));
        } catch {
          setBookmarked(false);
        }
      });
    } catch {
      apiGet<{ bookmarked: boolean }>(`/articles/${slug}/bookmark`).then(r => setBookmarked(Boolean(r.bookmarked))).catch(()=>setBookmarked(false));
    }
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
    <button
      type="button"
      onClick={toggle}
      disabled={sending}
      className={`px-2 py-1 rounded-full disabled:opacity-50 ${bookmarked ? "btn-primary" : "btn-ghost"}`}
      title={bookmarked ? "В закладках" : "Добавить в закладки"}
    >
      <span className="inline-flex items-center gap-[6px]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 2a2 2 0 0 0-2 2v18l8-5.33L20 22V4a2 2 0 0 0-2-2H6z" fill={bookmarked ? "var(--controlBtnPrimaryBg)" : "currentColor"} />
        </svg>
      </span>
    </button>
  );
}


