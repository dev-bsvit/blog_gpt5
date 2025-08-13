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
      <div className="flex items-center justify-between">
        <h2 className="ty-h3">Последние статьи</h2>
        <div className="ty-meta">API: {apiStatus}</div>
      </div>
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
        <div className="puk-grid-8">
          {articles.map((a: ArticleListItem) => (
            <div key={a.slug} className="col-span-8 md:col-span-4">
              <ArticleCard a={a} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


