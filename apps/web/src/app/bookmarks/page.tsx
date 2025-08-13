"use client";
import { useEffect, useState } from "react";
// import { apiGet } from "@/lib/api";
import useSWR from "swr";
import SiteShell from "@/components/SiteShell";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";
import PageLoader from "@/components/PageLoader";

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
    <SiteShell>
      <h1 className="ty-h2">Закладки</h1>
      <PageLoader active={loading} />
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
        <div>
          {loading ? (
            <div className="puk-grid">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="puk-col-12">
                  <div className="rounded-3xl border border-divider bg-block shadow-1 p-4 animate-pulse">
                    <div className="aspect-[16/9] rounded-2xl bg-tertiary-block" />
                    <div className="h-4 bg-tertiary-block mt-3 rounded" />
                    <div className="h-4 bg-tertiary-block mt-2 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((a) => (
                <ArticleCard key={a.slug} a={a} />
              ))}
            </div>
          )}
        </div>
      )}
    </SiteShell>
  );
}


