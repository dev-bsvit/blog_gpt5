"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
// import useSWR from "swr";
import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";

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
    <main className="puk-container p-6 space-y-4">
      <h1 className="ty-h2">Поиск</h1>
      <form onSubmit={(e)=>{e.preventDefault(); run();}} className="flex gap-2d">
        <input className="flex-1 border border-divider rounded-2xl px-3d py-2d bg-transparent" placeholder="запрос..." value={q} onChange={e=>setQ(e.target.value)} />
        <button className="px-3d py-2d rounded-2xl btn-primary" disabled={loading}>Найти</button>
      </form>
      <div className="puk-grid">
        <div className="hidden lg:block puk-col-3" />
        <div className="puk-col-14 lg:puk-col-8">
          <div className="puk-grid">
            {items.map(a=> (
              <div key={a.slug} className="puk-col-12 md:puk-col-6">
                <ArticleCard a={a} />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:block puk-col-3" />
      </div>
    </main>
  );
}


