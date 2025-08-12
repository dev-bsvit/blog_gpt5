"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebaseClient";

type CommentItem = { id: string; text: string; author?: string; created_at?: string };

export default function Comments({ slug }: { slug: string }) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [canPost, setCanPost] = useState(false);
  const [sending, setSending] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    apiGet<CommentItem[]>(`/articles/${slug}/comments`)
      .then(setItems)
      .catch(() => setItems([]));
    try {
      const auth = getFirebaseAuth();
      return onAuthStateChanged(auth, (u) => {
        setCanPost(Boolean(u));
        setUid(u?.uid || null);
      });
    } catch {
      setCanPost(false);
      setUid(null);
    }
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      let userId = uid;
      if (!userId) {
        try {
          const auth = getFirebaseAuth();
          const res = await signInWithPopup(auth, googleProvider);
          userId = res.user?.uid || null;
          setUid(userId);
        } catch {
          setSending(false);
          return;
        }
      }
      const headers = userId ? { "X-User-Id": userId } : undefined;
      const c = await apiPost<CommentItem>(`/articles/${slug}/comments`, { text }, headers ? { headers } : undefined);
      setItems((prev) => [c, ...prev]);
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="pt-6">
      <h2 className="text-lg font-semibold mb-2">Комментарии</h2>
      <div className="space-y-3">
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id} className="border rounded p-3">
              <div className="text-sm text-gray-400">{c.author || "Anon"} — {c.created_at?.replace("T"," ").replace("Z","")}</div>
              <div>{c.text}</div>
            </li>
          ))}
          {items.length === 0 && <div className="text-sm text-gray-500">Пока нет комментариев.</div>}
        </ul>
        <form onSubmit={submit} className="flex gap-2">
          <input className="flex-1 border rounded px-3 py-2 bg-transparent" value={text} onChange={(e)=>setText(e.target.value)} placeholder="Написать комментарий" />
          <button type="submit" disabled={sending} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{sending? "Отправляю..." : (uid?"Отправить":"Войти и отправить")}</button>
        </form>
      </div>
    </section>
  );
}


