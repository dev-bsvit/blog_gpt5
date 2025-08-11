"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";

type Article = ArticleListItem;

export default function DraftsPage() {
  const [items, setItems] = useState<Article[]>([]);
  useEffect(() => {
    apiGet<Article[]>("/articles").then((list) => {
      setItems(list.filter((a) => a.is_published === false));
    }).catch(() => setItems([]));
  }, []);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Черновики</h1>
      {items.length === 0 ? (
        <div className="text-sm text-gray-500">Черновиков нет.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.slug}>
              <ArticleCard a={a} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}


