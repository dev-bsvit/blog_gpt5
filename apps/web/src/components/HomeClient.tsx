"use client";
import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { apiPost } from "@/lib/api";
import { GridSkeleton } from "@/components/Skeletons";

export default function HomeClient({ initialArticles, initialHealth }: { initialArticles: ArticleListItem[]; initialHealth: string }) {
  const [createResult, setCreateResult] = useState<string>("");
  // Дефолтный fetcher берётся из SWRConfig: используем сигнатуру useSWR(key, options)
  const { data: health } = useSWR("/articles/health", { fallbackData: { status: initialHealth } });
  const { data: list, isLoading } = useSWR("/articles", { fallbackData: initialArticles });
  const articles = useMemo(() => (list || []).filter((a: ArticleListItem) => a.is_published !== false), [list]);
  const apiStatus = (health as { status?: string })?.status ?? "...";

  // function createTestArticle() { /* dev helper removed for prod build */ }

  return (
    <div className="space-y-6">
      {/* header removed per spec */}
      {createResult && (
        <div className="ty-meta">
          {createResult}
          {createResult.startsWith("Создано: ") && (
            <a className="ml-2 underline" href={`/article/${createResult.replace("Создано: ", "")}`}>открыть</a>
          )}
        </div>
      )}
      {(isLoading && (!initialArticles || initialArticles.length === 0)) ? (
        <GridSkeleton items={6} />
      ) : articles.length === 0 ? (
        <div className="ty-meta">Пока пусто. Напишите первую статью.</div>
      ) : (
        <div className="space-y-4">
          {articles.map((a: ArticleListItem) => (
            <ArticleCard key={a.slug} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}


