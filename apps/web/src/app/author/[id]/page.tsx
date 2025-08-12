import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";
import SubscribeButton from "@/components/SubscribeButton";
import PageLoader from "@/components/PageLoader";

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
    <main className="puk-container p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="ty-h2">Автор: {authorName}</h1>
        <SubscribeButton authorId={id} />
      </header>
      {items.length === 0 ? (
        <div className="ty-meta">Пока нет статей.</div>
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
      {/* SSR страницы автора может подтягиваться долго — покажем loader на клиенте при навигации */}
      {/* PageLoader здесь на SSR не активен, но пригодится при клиентских переходах */}
      <PageLoader active={false} />
    </main>
  );
}


