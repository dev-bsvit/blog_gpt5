"use client";
import { useEffect, useState } from "react";
// import { apiGet } from "@/lib/api";
import useSWR from "swr";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";

type Article = ArticleListItem;

export default function MyArticlesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (u) => setUser(u));
    } catch {
      setUser(null);
    }
    return () => { if (unsub) unsub(); };
  }, []);

  const { data, isLoading, error: swrError } = useSWR(user ? "/users/me/articles" : null, null, { shouldRetryOnError: false });
  const { data: allData } = useSWR(user ? "/articles" : null, null, { shouldRetryOnError: false });
  useEffect(() => {
    if (!user) return;
    setLoading(isLoading);
    setError(swrError ? (swrError instanceof Error ? swrError.message : String(swrError)) : null);
    let arr: Article[] = Array.isArray(data) ? (data as Article[]) : [];
    if ((!arr || arr.length === 0) && Array.isArray(allData)) {
      const uid = user.uid;
      arr = (allData as Article[]).filter(a => (a as unknown as { created_by?: string }).created_by === uid);
    }
    setItems(arr || []);
  }, [user, data, allData, isLoading, swrError]);

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Мои статьи</h1>
      {loading && <div className="text-sm text-gray-500">Загрузка…</div>}
      {!loading && !user && (
        <div className="text-sm text-gray-400">
          Требуется вход. Перейдите на страницу <a className="underline" href="/login">Вход</a>.
        </div>
      )}
      {error && user && <div className="text-sm text-red-400">{error}</div>}
      {user && Array.isArray(items) && (
        <>
          <div>
            <a href="/write" className="px-3 py-2 rounded bg-blue-600 text-white">Написать</a>
          </div>
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">Пока пусто</div>
          ) : (
            <ul className="space-y-3">
              {items.map((a) => (
                <li key={a.slug}>
                  <ArticleCard a={a} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}


