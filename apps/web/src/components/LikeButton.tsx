"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function LikeButton({ slug }: { slug: string }) {
  const [likes, setLikes] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    async function fetchState(uid?: string | null) {
      try {
        const headers: HeadersInit | undefined = uid ? { "X-User-Id": uid } : undefined;
        const r = await apiGet<{ likes: number; liked?: boolean }>(`/articles/${slug}/likes`, { headers });
        setLikes(r.likes);
        setLiked(Boolean(r.liked));
      } catch {
        setLikes(0);
        setLiked(false);
      }
    }
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (u) => {
        const uid = u?.uid || null;
        setUserId(uid);
        fetchState(uid);
      });
    } catch {
      fetchState(null);
    }
    return () => { if (unsub) unsub(); };
  }, [slug]);

  async function like() {
    setSending(true);
    try {
      setError(null);
      // optimistic
      setLiked((v) => !v);
      setLikes((n) => (n === null ? n : (liked ? (n - 1) : (n + 1))));
      const r = await apiPost<{ likes: number; liked: boolean }>(
        `/articles/${slug}/likes`,
        userId ? { user_id: userId } : {},
        userId ? { headers: { "X-User-Id": userId } } : undefined
      );
      setLikes(r.likes);
      setLiked(Boolean(r.liked));
    } catch (e) {
      setError("Не удалось поставить лайк");
      // rollback
      setLiked((v) => !v);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={like} disabled={sending}
        className={`px-3 py-1 rounded disabled:opacity-50 ${liked ? "bg-pink-700 text-white" : "bg-pink-600 text-white"}`}>
        {liked ? "♥" : "❤"} {likes ?? "..."}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}


