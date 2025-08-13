import ArticleCard, { ArticleListItem } from "@/components/ArticleCard";
import SubscribeButton from "@/components/SubscribeButton";
import PageLoader from "@/components/PageLoader";
import { GridSkeleton } from "@/components/Skeletons";
import SiteShell from "@/components/SiteShell";

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
    <SiteShell>
      <header className="flex items-center justify-between">
        <h1 className="ty-h2">Автор: {authorName}</h1>
        <SubscribeButton authorId={id} />
      </header>
      {!items || items.length === 0 ? (
        <GridSkeleton items={6} />
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <ArticleCard key={a.slug} a={a} />
          ))}
        </div>
      )}
      <PageLoader active={false} />
    </SiteShell>
  );
}


