"use client";
import { useEffect, useState } from "react";
// import { apiGet } from "@/lib/api";
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
    <main className="puk-container p-6 space-y-4">
      <h1 className="ty-h2">Закладки</h1>
      {loading && <div className="ty-meta">Загрузка…</div>}
      {!loading && !user && (
        <div className="ty-meta">
          Требуется вход. Перейдите на страницу <a className="underline" href="/login">Вход</a> и вернитесь сюда.
        </div>
      )}
      {error && user && <div className="ty-meta" style={{ color: "var(--textStatusAlert)" }}>{error}</div>}
      {user && items.length === 0 && !error && (
        <div className="ty-meta">Пусто</div>
      )}
      {user && (
        <div className="puk-grid">
          <div className="hidden lg:block puk-col-3" />
          <div className="puk-col-14 lg:puk-col-8">
            <div className="puk-grid">
              {items.map((a) => (
                <div key={a.slug} className="puk-col-12 md:puk-col-6">
                  <ArticleCard a={a} />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block puk-col-3" />
        </div>
      )}
    </main>
  );
}


