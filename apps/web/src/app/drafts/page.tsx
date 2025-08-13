"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";
import { GridSkeleton } from "@/components/Skeletons";
import SiteShell from "@/components/SiteShell";

type Article = ArticleListItem;

export default function DraftsPage() {
  const [items, setItems] = useState<Article[]>([]);
  useEffect(() => {
    apiGet<Article[]>("/articles").then((list) => {
      setItems(list.filter((a) => a.is_published === false));
    }).catch(() => setItems([]));
  }, []);
  return (
    <SiteShell>
      <h1 className="ty-h2 mb-4">Черновики</h1>
      {!items ? (
        <GridSkeleton items={6} />
      ) : items.length === 0 ? (
        <div className="ty-meta">Черновиков нет.</div>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <ArticleCard key={a.slug} a={a} />
          ))}
        </div>
      )}
    </SiteShell>
  );
}


