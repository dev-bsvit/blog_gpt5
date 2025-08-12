"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/PageLoader";
// import { apiGet } from "@/lib/api";
import useSWR from "swr";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";

type Article = ArticleListItem;

export default function MyArticlesPage() {
  const router = useRouter();
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

  // If user is authorized and has articles → redirect to author page
  useEffect(() => {
    if (!loading && user && items && items.length > 0) {
      router.replace(`/author/${user.uid}`);
    }
  }, [loading, user, items, router]);

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Мои статьи</h1>
      <PageLoader active={loading} />
      {!loading && !user && (
        <div className="text-sm text-gray-400">
          Требуется вход. Перейдите на страницу <a className="underline" href="/login">Вход</a>.
        </div>
      )}
      {error && user && null}
      {user && Array.isArray(items) && items.length === 0 && (
        <>
          <div>
            <a href="/write" className="px-3 py-2 rounded bg-blue-600 text-white">Написать</a>
          </div>
          <div className="text-sm text-gray-500">Пока нет статей. Начните с первой публикации.</div>
        </>
      )}
    </main>
  );
}


