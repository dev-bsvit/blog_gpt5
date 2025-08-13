"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
// import useSWR from "swr";
import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";
import { GridSkeleton } from "@/components/Skeletons";
import SiteShell from "@/components/SiteShell";

type Article = ArticleListItem;

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    const query = q.trim();
    if (!query) { setItems([]); return; }
    setLoading(true);
    try {
      const res = await apiGet<Article[]>(`/search?q=${encodeURIComponent(query)}`);
      setItems(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { /* no-op */ }, []);

  return (
    <SiteShell>
      <h1 className="ty-h2">Поиск</h1>
      <form onSubmit={(e)=>{e.preventDefault(); run();}} className="flex gap-2d">
        <input className="flex-1 border border-divider rounded-2xl px-3d py-2d bg-transparent" placeholder="запрос..." value={q} onChange={e=>setQ(e.target.value)} />
        <button className="px-3d py-2d rounded-2xl btn-primary" disabled={loading}>Найти</button>
      </form>
      <div className="puk-grid">
        {loading ? (
          <GridSkeleton items={6} />
        ) : (
          items.map(a=> (
            <div key={a.slug} className="puk-col-12 md:puk-col-6">
              <ArticleCard a={a} />
            </div>
          ))
        )}
      </div>
    </SiteShell>
  );
}


