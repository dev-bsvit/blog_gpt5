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

  async function createTestArticle() {
    try {
      const r = await apiPost<{ slug: string }>("/articles", {
        title: "Hello from UI",
        content: "Это тестовая статья, созданная из интерфейса.\n\nЗдесь можно писать контент и он будет отображаться красиво.",
        subtitle: "Тест публикация",
      });
      setCreateResult(`Создано: ${r.slug}`);
      mutate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setCreateResult(`Ошибка: ${msg}`);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Последние статьи</h1>
        <div className="text-sm text-gray-500">API: {apiStatus}</div>
      </div>
      {createResult && (
        <div className="text-sm text-gray-600">
          {createResult}
          {createResult.startsWith("Создано: ") && (
            <a className="ml-2 underline" href={`/article/${createResult.replace("Создано: ", "")}`}>открыть</a>
          )}
        </div>
      )}
      {articles.length === 0 ? (
        <div className="text-sm text-gray-500">Пока пусто. Напишите первую статью.</div>
      ) : (
        <ul className="space-y-3">
          {articles.map((a: ArticleListItem) => (
            <li key={a.slug}>
              <ArticleCard a={a} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}


