import HomeClient from "@/components/HomeClient";
import HomeTabs from "@/components/HomeTabs";
import { Suspense } from "react";
import NewsList from "@/components/NewsList";

export const revalidate = 30;

export default async function Home() {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  if (!base) {
    return <HomeClient initialArticles={[]} initialHealth={"unknown"} />;
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
        <main className="puk-container p-6 space-y-6">
          <div className="puk-grid">
            {/* Left: tabs (3/14) */}
            <div className="hidden lg:block puk-col-3">
              <Suspense fallback={<div className="ty-meta">…</div>}>
                <HomeTabs />
              </Suspense>
            </div>
            {/* Center: articles (8/14) */}
            <div className="puk-col-14 lg:puk-col-8">
              <h1 className="ty-h2 mb-3d">Лента</h1>
              <HomeClient initialArticles={list} initialHealth={health?.status || "ok"} />
            </div>
            {/* Right: news (3/14) */}
            <div className="hidden lg:block puk-col-3">
              <NewsList />
            </div>
          </div>
        </main>
      </>
    );
  } catch {
    return <HomeClient initialArticles={[]} initialHealth={"unknown"} />;
  }
}
