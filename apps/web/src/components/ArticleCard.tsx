"use client";
import LikeButton from "./LikeButton";
import BookmarkButton from "./BookmarkButton";
import SubscribeButton from "./SubscribeButton";
import Link from "next/link";
import Image from "next/image";

export type ArticleListItem = {
  slug: string;
  title?: string;
  subtitle?: string;
  is_published?: boolean;
  created_at?: string;
  created_by?: string;
  created_by_name?: string;
  created_by_photo?: string;
  likes?: number;
  views?: number;
  comments_count?: number;
  tags?: string[];
  category?: string;
  reading_time_minutes?: number;
  cover_url?: string;
  cover_alt?: string;
};

export default function ArticleCard({ a }: { a: ArticleListItem }) {
  const author = a.created_by_name || a.created_by || "Автор";
  const tags = Array.isArray(a.tags) ? a.tags : [];
  return (
    <article className="group h-full rounded-3xl border border-divider bg-block shadow-1 transition hover:shadow-2 flex flex-col">
      {/* Cover with padding and rounded 16px */}
      <div className="p-[16px]">
        <Link href={`/article/${a.slug}`} className="block relative aspect-[16/9] overflow-hidden rounded-2xl">
          {a.cover_url ? (
            <Image src={a.cover_url} alt={a.cover_alt || a.title || a.slug || "cover"} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 bg-tertiary-block transition-transform duration-300 group-hover:scale-105" />
          )}
        </Link>
      </div>

      {/* Content */}
      <div className="px-[16px] pb-[16px] flex-1 flex flex-col">
        {/* Author row + subscribe */}
        <div className="flex items-center justify-between gap-[16px] flex-none overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-[12px] flex-1 min-w-0 overflow-hidden">
            {a.created_by_photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.created_by_photo} alt={author} className="w-[40px] h-[40px] rounded-full object-cover" />
            )}
            <div>
              <div className="ty-body font-medium overflow-hidden text-ellipsis">
                <Link href={a.created_by ? `/author/${a.created_by}` : "#"} className="underline decoration-transparent hover:decoration-inherit overflow-hidden text-ellipsis" style={{ color: "var(--textPrimary)" }}>
                  {author}
                </Link>
              </div>
              <div className="ty-meta mt-1 flex items-center gap-[6px] overflow-hidden">
                {a.category && <span>{a.category}</span>}
                {a.reading_time_minutes && <>
                  <span>·</span>
                  <span>{a.reading_time_minutes} мин чтения</span>
                </>}
              </div>
            </div>
          </div>
          <SubscribeButton authorId={a.created_by} />
        </div>

        {/* Title and subtitle */}
        <div className="mt-[12px] flex-none">
          <Link href={`/article/${a.slug}`} className="ty-h3 underline decoration-transparent hover:decoration-inherit line-clamp-2" style={{ color: "var(--textPrimary)" }}>
            {a.title || a.slug}
          </Link>
          {a.subtitle && (
            <p className="ty-subtitle mt-[8px] line-clamp-2" style={{ color: "var(--textSecondary)" }}>{a.subtitle}</p>
          )}
        </div>

        {/* Like (emoji pill) */}
        <div className="mt-[8px] flex-none">
          <LikeButton slug={a.slug} />
        </div>

        {/* Tags */}
        {(tags.length > 0) && (
          <div className="mt-[12px] flex flex-wrap gap-[8px] ty-meta">
            {tags.map((t) => (
              <Link key={t} href={`/search?tag=${encodeURIComponent(t)}`} className="underline decoration-transparent hover:decoration-inherit">#{t}</Link>
            ))}
          </div>
        )}

        {/* Bottom actions and metrics */}
        <div className="mt-auto pt-[12px] flex items-center justify-between overflow-hidden">
          {/* Left: views */}
          <div className="flex items-center gap-[8px] ty-meta" style={{ color: "var(--textSecondary)" }}>
            <span className="inline-flex items-center gap-[6px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="currentColor"/>
              </svg>
              {a.views ?? 0}
            </span>
          </div>
          {/* Right: comments counter + bookmark icon */}
          <div className="flex items-center gap-[8px] ty-meta" style={{ color: "var(--textSecondary)" }}>
            <span className="inline-flex items-center gap-[6px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M21 6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3l4 4 4-4h3a2 2 0 0 0 2-2V6z" fill="currentColor"/>
              </svg>
              {(a.comments_count ?? 0) > 0 ? (a.comments_count as number) : null}
            </span>
            <BookmarkButton slug={a.slug} />
          </div>
        </div>
      </div>
    </article>
  );
}


