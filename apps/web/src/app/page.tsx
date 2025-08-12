import HomeClient from "@/components/HomeClient";
import HomeTabs from "@/components/HomeTabs";
import { Suspense } from "react";

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
          <div className="flex items-center justify-between">
            <h1 className="ty-h2">Лента</h1>
            <Suspense fallback={<div className="ty-meta">…</div>}>
              <HomeTabs />
            </Suspense>
          </div>
        </main>
        <HomeClient initialArticles={list} initialHealth={health?.status || "ok"} />
      </>
    );
  } catch {
    return <HomeClient initialArticles={[]} initialHealth={"unknown"} />;
  }
}
