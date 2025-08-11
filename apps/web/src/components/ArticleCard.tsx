"use client";
import LikeButton from "./LikeButton";
import BookmarkButton from "./BookmarkButton";
import SubscribeButton from "./SubscribeButton";
import { formatDate } from "@/lib/date";

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
};

export default function ArticleCard({ a }: { a: ArticleListItem }) {
  const author = a.created_by_name || a.created_by || "Автор";
  const tags = Array.isArray(a.tags) ? a.tags : [];
  return (
    <article className="border rounded-lg p-4 hover:bg-white/5 transition">
      <header className="flex items-start justify-between gap-3">
        <div>
          <a href={`/article/${a.slug}`} className="text-lg font-semibold underline">
            {a.title || a.slug}
          </a>
          {a.subtitle && (
            <p className="text-sm text-gray-500 mt-1">{a.subtitle}</p>
          )}
          <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
            {a.created_by_photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.created_by_photo} alt={author} className="w-6 h-6 rounded-full object-cover" />
            )}
            <span className="text-sm text-gray-200">{author}</span>
            {a.created_at && <span className="ml-2">· {formatDate(a.created_at)}</span>}
            <SubscribeButton authorId={a.created_by} />
          </div>
        </div>
        <div className="shrink-0">
          <BookmarkButton slug={a.slug} />
        </div>
      </header>

      {(a.category || tags.length > 0 || a.reading_time_minutes) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {a.category && (
            <span key="category" className="text-xs px-2 py-1 rounded bg-indigo-700 text-white">{a.category}</span>
          )}
          {tags.map((t) => (
            <span key={t} className="text-xs px-2 py-1 rounded bg-zinc-700 text-gray-100">#{t}</span>
          ))}
          {a.reading_time_minutes && (
            <span key="rt" className="text-xs px-2 py-1 rounded bg-emerald-700 text-white">{a.reading_time_minutes} мин чтения</span>
          )}
        </div>
      )}

      <footer className="mt-3 flex items-center gap-3 text-sm text-gray-400">
        <LikeButton slug={a.slug} />
        <span>Комментарии: {a.comments_count ?? 0}</span>
        <span>Просмотры: {a.views ?? 0}</span>
      </footer>
    </article>
  );
}


