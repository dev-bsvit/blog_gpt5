"use client";
import LikeButton from "./LikeButton";
import BookmarkButton from "./BookmarkButton";
import SubscribeButton from "./SubscribeButton";
import { formatDate } from "@/lib/date";
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
    <article className="group rounded-3xl border border-divider bg-block shadow-1 transition hover:shadow-2">
      {/* Cover */}
      <div className="p-4">
        <Link href={`/article/${a.slug}`} className="block relative aspect-[16/9] overflow-hidden rounded-2xl">
          {a.cover_url ? (
            <Image src={a.cover_url} alt={a.cover_alt || a.title || a.slug || "cover"} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 bg-tertiary-block transition-transform duration-300 group-hover:scale-105" />
          )}
        </Link>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Author + subscribe */}
        <div className="flex items-center justify-between gap-[12px]">
          <div className="flex items-center gap-[12px]">
            {a.created_by_photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.created_by_photo} alt={author} className="w-11 h-11 rounded-full object-cover" />
            )}
            <div>
              <Link href={a.created_by ? `/author/${a.created_by}` : "#"} className="ty-body font-medium underline decoration-transparent hover:decoration-inherit">
                {author}
              </Link>
              <div className="ty-meta mt-1 flex items-center gap-[6px]">
                {a.category && <span>{a.category}</span>}
                {a.reading_time_minutes && (
                  <>
                    <span>·</span>
                    <span>{a.reading_time_minutes} мин чтения</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <SubscribeButton authorId={a.created_by} />
        </div>

        {/* Title and subtitle */}
        <div className="mt-[12px]">
          <Link href={`/article/${a.slug}`} className="ty-h3 underline decoration-transparent hover:decoration-inherit">
            {a.title || a.slug}
          </Link>
          {a.subtitle && <p className="ty-subtitle mt-1">{a.subtitle}</p>}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-[12px] flex flex-wrap gap-[8px]">
            {tags.map((t) => (
              <span key={t} className="ty-meta px-2 py-1 rounded-2xl border border-divider text-brand">#{t}</span>
            ))}
          </div>
        )}

        {/* Bottom metrics + actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-[12px] ty-meta" aria-label="статистика">
            <span className="inline-flex items-center gap-[6px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M21 6c0-1.1-.9-2-2-2H5C3.9 4 3 4.9 3 6v10c0 1.1.9 2 2 2h12l4 4V6z" fill="var(--bgOverlay)"/>
              </svg>
              {a.comments_count ?? 0}
            </span>
            <span className="inline-flex items-center gap-[6px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" fill="var(--bgOverlay)"/>
              </svg>
              {a.views ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-[8px]">
            <LikeButton slug={a.slug} />
            <BookmarkButton slug={a.slug} />
          </div>
        </div>
      </div>
    </article>
  );
}


