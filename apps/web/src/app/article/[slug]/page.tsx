import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RenderEditorJS from "@/components/RenderEditorJS";
import Comments from "@/components/Comments";
import PublishControls from "@/components/PublishControls";
import EditOwnerLink from "@/components/EditOwnerLink";
import LikeButton from "@/components/LikeButton";
import BookmarkButton from "@/components/BookmarkButton";
import { formatDate } from "@/lib/date";
import Image from "next/image";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";

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

export const revalidate = 0;

async function fetchArticle(slug: string): Promise<Article | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE is not set");
  const res = await fetch(`${base.replace(/\/$/, "")}/articles/${slug}`, { cache: "no-store" });
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
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      {article.cover_url && (
        <figure className="relative mb-4 overflow-hidden rounded-2xl aspect-[16/9]">
          <Image src={article.cover_url} alt={article.cover_alt || article.title || article.slug} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
          {article.cover_caption && <figcaption className="mt-2 ty-meta">{article.cover_caption}</figcaption>}
        </figure>
      )}
      <h1 className="ty-h1">{article.title ?? article.slug}</h1>
      {article.subtitle && <p className="ty-subtitle">{article.subtitle}</p>}
      <div className="ty-meta">slug: {article.slug}</div>
      {(() => {
        const raw = article.content as unknown;
        if (typeof raw === "string") {
          // 1) Trix HTML → render as HTML
          const isLikelyHtml = /<\w+[\s\S]*>/i.test(raw);
          if (isLikelyHtml) {
            return (
              <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: raw }} />
            );
          }
          // 2) Editor.js JSON → legacy renderer
          try {
            const data = JSON.parse(raw);
            if (data && Array.isArray(data.blocks)) {
              return <RenderEditorJS data={data} />;
            }
          } catch {}
          // 3) Markdown fallback
          if (raw.trim().length > 0) {
            return (
              <article className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{raw}</ReactMarkdown>
              </article>
            );
          }
        }
        return <div className="ty-meta">Нет содержимого</div>;
      })()}
      <PageLoader active={false} />
      <div className="ty-meta flex items-center gap-2d">
        {article.created_by_photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.created_by_photo} alt={article.created_by_name || "Автор"} className="w-8 h-8 rounded-full object-cover" />
        )}
        <Link href={article.created_by ? `/author/${article.created_by}` : "#"} className="underline">
          {article.created_by_name || article.created_by || "Автор"}
        </Link>
        {article.created_at && <span>· {formatDate(article.created_at)}</span>}
      </div>
      {(article.tags || article.category || article.reading_time_minutes) && (
        <div className="mt-2 flex flex-wrap gap-2 ty-meta">
          {article.category && (
            <span className="px-2 py-1 rounded bg-brand text-inv">{String(article.category)}</span>
          )}
          {Array.isArray(article.tags) && article.tags.map((t: string) => (
            <span key={t} className="px-2 py-1 rounded-2xl border border-divider text-brand">#{t}</span>
          ))}
          {article.reading_time_minutes && (
            <span className="px-2 py-1 rounded bg-success text-inv">{Number(article.reading_time_minutes)} мин чтения</span>
          )}
        </div>
      )}
      <div className="flex gap-3 pt-2 items-center">
        <EditOwnerLink slug={article.slug} createdBy={article.created_by} />
        <PublishControls slug={article.slug} isPublished={Boolean((article as unknown as { is_published?: boolean }).is_published)} createdBy={article.created_by} />
        <LikeButton slug={article.slug} />
        <BookmarkButton slug={article.slug} />
      </div>

      <div className="text-xs text-gray-500">Просмотры: {Number(article.views ?? 0)}</div>

      <Comments slug={article.slug} />
    </main>
  );
}



