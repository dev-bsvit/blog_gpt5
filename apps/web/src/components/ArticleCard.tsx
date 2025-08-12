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
      {/* Cover with padding and rounded 16px */}
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
        {/* Author row + subscribe */}
        <div className="flex items-center justify-between gap-3d">
          <div className="flex items-center gap-3d">
            {a.created_by_photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.created_by_photo} alt={author} className="w-11 h-11 rounded-full object-cover" />
            )}
            <div>
              <div className="ty-body font-medium">
                <Link href={a.created_by ? `/author/${a.created_by}` : "#"} className="underline decoration-transparent hover:decoration-inherit">
                  {author}
                </Link>
              </div>
              <div className="ty-meta mt-1 flex items-center gap-1d">
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
        <div className="mt-3d">
          <Link href={`/article/${a.slug}`} className="ty-h3 underline decoration-transparent hover:decoration-inherit">
            {a.title || a.slug}
          </Link>
          {a.subtitle && (
            <p className="ty-subtitle mt-1">{a.subtitle}</p>
          )}
        </div>

        {/* Tags */}
        {(tags.length > 0) && (
          <div className="mt-3d flex flex-wrap gap-2d">
            {tags.map((t) => (
              <span key={t} className="ty-meta px-2 py-1 rounded-2xl border border-divider text-brand">#{t}</span>
            ))}
          </div>
        )}

        {/* Bottom actions and metrics */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3d ty-meta">
            <span>💬 {a.comments_count ?? 0}</span>
            <span>👁️ {a.views ?? 0}</span>
          </div>
          <div className="flex items-center gap-2d">
            <LikeButton slug={a.slug} />
            <BookmarkButton slug={a.slug} />
          </div>
        </div>
      </div>
    </article>
  );
}


