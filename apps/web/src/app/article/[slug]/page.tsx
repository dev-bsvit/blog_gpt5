import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RenderEditorJS from "@/components/RenderEditorJS";
import Comments from "@/components/Comments";
import PublishControls from "@/components/PublishControls";
import LikeButton from "@/components/LikeButton";
import BookmarkButton from "@/components/BookmarkButton";
import { formatDate } from "@/lib/date";
import Image from "next/image";

type Article = {
  slug: string;
  title?: string;
  subtitle?: string;
  content?: unknown;
  views?: number;
  created_by?: string;
  created_at?: string;
  created_by_name?: string;
  created_by_photo?: string;
  tags?: string[];
  category?: string;
  reading_time_minutes?: number;
  cover_url?: string;
  cover_alt?: string;
  cover_caption?: string;
};

export const revalidate = 60;

async function fetchArticle(slug: string): Promise<Article | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE is not set");
  const res = await fetch(`${base.replace(/\/$/, "")}/articles/${slug}`, { next: { revalidate } });
  if (!res.ok) return null;
  return (await res.json()) as Article;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  const title = article?.title || slug;
  const description = article?.subtitle || `Статья: ${title}`;
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const canonical = `${site}/article/${slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  } as const;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return notFound();

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      {article.cover_url && (
        <figure className="relative mb-4 overflow-hidden rounded-2xl aspect-[16/9]">
          <Image src={article.cover_url} alt={article.cover_alt || article.title || article.slug} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
          {article.cover_caption && <figcaption className="mt-2 text-xs text-gray-500">{article.cover_caption}</figcaption>}
        </figure>
      )}
      <h1 className="text-3xl font-semibold">{article.title ?? article.slug}</h1>
      {article.subtitle && <p className="text-gray-500">{article.subtitle}</p>}
      <div className="text-sm text-gray-400">slug: {article.slug}</div>
      {(() => {
        const raw = article.content as unknown;
        if (typeof raw === "string") {
          // Try parse Editor.js JSON; fallback to Markdown
          try {
            const data = JSON.parse(raw);
            if (data && Array.isArray(data.blocks)) {
              return <RenderEditorJS data={data} />;
            }
          } catch {}
          if (raw.trim().length > 0) {
            return (
              <article className="prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{raw}</ReactMarkdown>
              </article>
            );
          }
        }
        return <div className="text-sm text-gray-500">Нет содержимого</div>;
      })()}
      <div className="text-sm text-gray-300 flex items-center gap-2">
        {article.created_by_photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.created_by_photo} alt={article.created_by_name || "Автор"} className="w-8 h-8 rounded-full object-cover" />
        )}
        <a href={article.created_by ? `/author/${article.created_by}` : "#"} className="underline">
          {article.created_by_name || article.created_by || "Автор"}
        </a>
        {article.created_at && <span className="text-gray-400">· {formatDate(article.created_at)}</span>}
      </div>
      {(article.tags || article.category || article.reading_time_minutes) && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {article.category && (
            <span className="px-2 py-1 rounded bg-indigo-700 text-white">{String(article.category)}</span>
          )}
          {Array.isArray(article.tags) && article.tags.map((t: string) => (
            <span key={t} className="px-2 py-1 rounded bg-zinc-700 text-gray-100">#{t}</span>
          ))}
          {article.reading_time_minutes && (
            <span className="px-2 py-1 rounded bg-emerald-700 text-white">{Number(article.reading_time_minutes)} мин чтения</span>
          )}
        </div>
      )}
      <div className="flex gap-3 pt-2 items-center">
        <a className="underline" href={`/article/${article.slug}/edit`}>Редактировать</a>
        <PublishControls slug={article.slug} isPublished={Boolean((article as unknown as { is_published?: boolean }).is_published)} createdBy={article.created_by} />
        <LikeButton slug={article.slug} />
        <BookmarkButton slug={article.slug} />
      </div>

      <div className="text-xs text-gray-500">Просмотры: {Number(article.views ?? 0)}</div>

      <Comments slug={article.slug} />
    </main>
  );
}



