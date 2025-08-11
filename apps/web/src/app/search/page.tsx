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
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Поиск</h1>
      <form onSubmit={(e)=>{e.preventDefault(); run();}} className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2 bg-transparent" placeholder="запрос..." value={q} onChange={e=>setQ(e.target.value)} />
        <button className="px-3 py-2 rounded bg-blue-600 text-white" disabled={loading}>Найти</button>
      </form>
      <ul className="space-y-3">
        {items.map(a=> (
          <li key={a.slug}>
            <ArticleCard a={a} />
          </li>
        ))}
      </ul>
    </main>
  );
}


