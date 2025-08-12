import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";
import SubscribeButton from "@/components/SubscribeButton";

export const revalidate = 60;

async function fetchAllArticles(): Promise<ArticleListItem[]> {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  if (!base) return [];
  try {
    const res = await fetch(`${base}/articles`, { next: { revalidate } });
    if (!res.ok) return [];
    return (await res.json()) as ArticleListItem[];
  } catch {
    return [];
  }
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const all = await fetchAllArticles();
  const items = all.filter((a) => (a.created_by || "") === id);
  const authorName = items[0]?.created_by_name || id;

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Автор: {authorName}</h1>
        <SubscribeButton authorId={id} />
      </header>
      {items.length === 0 ? (
        <div className="text-sm text-gray-500">Пока нет статей.</div>
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


