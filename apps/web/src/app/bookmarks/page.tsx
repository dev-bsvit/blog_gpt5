"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import useSWR from "swr";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";

type Article = ArticleListItem;

export default function BookmarksPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
      });
    } catch {
      setUser(null);
    }
    return () => { if (unsub) unsub(); };
  }, []);

  const { data, isLoading } = useSWR(user ? "/users/me/bookmarks" : null);
  useEffect(() => {
    if (!user) return;
    setLoading(isLoading);
    setError(null);
    setItems(Array.isArray(data) ? (data as Article[]) : []);
  }, [user, data, isLoading]);

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Закладки</h1>
      {loading && <div className="text-sm text-gray-500">Загрузка…</div>}
      {!loading && !user && (
        <div className="text-sm text-gray-400">
          Требуется вход. Перейдите на страницу <a className="underline" href="/login">Вход</a> и вернитесь сюда.
        </div>
      )}
      {error && user && <div className="text-sm text-red-400">{error}</div>}
      {user && items.length === 0 && !error && (
        <div className="text-sm text-gray-500">Пусто</div>
      )}
      {user && (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.slug}>
              <ArticleCard a={a} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}


