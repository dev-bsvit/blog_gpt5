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
    <main className="puk-container p-6">
      <h1 className="ty-h2 mb-4">Черновики</h1>
      {items.length === 0 ? (
        <div className="ty-meta">Черновиков нет.</div>
      ) : (
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


