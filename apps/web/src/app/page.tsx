import HomeClient from "@/components/HomeClient";
import { Suspense } from "react";
import SiteShell from "@/components/SiteShell";
import BookmarksPage from "@/app/bookmarks/page";

export const revalidate = 30;

export default async function Home({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  const sp = (await (searchParams || Promise.resolve({}))) as { tab?: string };
  const tab = (sp?.tab || "feed").toLowerCase();
  if (!base) {
    // Без API показываем чисто SSR рамку страницы без скелетонов
    return (
      <SiteShell>
        <h1 className="ty-h2 mb-3d">Лента</h1>
        <HomeClient initialArticles={[]} initialHealth={"unknown"} />
      </SiteShell>
    );
  }
  try {
    const [healthRes, listRes] = await Promise.all([
      fetch(`${base}/articles/health`, { next: { revalidate } }),
      fetch(`${base}/articles`, { next: { revalidate } }),
    ]);
    const health = await healthRes.json();
    const list = await listRes.json();
    return (
      <>
        {tab === "fav" ? (
          // Страница закладок уже содержит SiteShell внутри
          <BookmarksPage />
        ) : (
          <SiteShell>
            <h1 className="ty-h2 mb-3d">{tab === "subs" ? "Подписки" : "Лента"}</h1>
            <HomeClient initialArticles={list} initialHealth={health?.status || "ok"} />
          </SiteShell>
        )}
      </>
    );
  } catch {
    return <HomeClient initialArticles={[]} initialHealth={"unknown"} />;
  }
}
