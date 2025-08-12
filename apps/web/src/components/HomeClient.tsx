"use client";
import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { apiPost } from "@/lib/api";

export default function HomeClient({ initialArticles, initialHealth }: { initialArticles: ArticleListItem[]; initialHealth: string }) {
  const [createResult, setCreateResult] = useState<string>("");
  const { data: health } = useSWR("/articles/health", null, { fallbackData: { status: initialHealth } });
  const { data: list, mutate } = useSWR("/articles", null, { fallbackData: initialArticles });
  const articles = useMemo(() => (list || []).filter((a: ArticleListItem) => a.is_published !== false), [list]);
  const apiStatus = (health as { status?: string })?.status ?? "...";

  // function createTestArticle() { /* dev helper removed for prod build */ }

  return (
    <main className="puk-container p-6 space-y-6">
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
      {articles.length === 0 ? (
        <div className="ty-meta">Пока пусто. Напишите первую статью.</div>
      ) : (
        <div className="puk-grid">
          {articles.map((a: ArticleListItem) => (
            <div key={a.slug} className="puk-col-12 md:puk-col-6 lg:puk-col-4">
              <ArticleCard a={a} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}


