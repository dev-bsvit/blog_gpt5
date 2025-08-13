"use client";
import Link from "next/link";

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
    <article>
      <div>
        <Link href={`/article/${a.slug}`}>
          {a.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.cover_url} alt={a.cover_alt || a.title || a.slug || "cover"} />
          ) : null}
        </Link>
      </div>

      <div>
        <div>
          <div>
            {a.created_by_photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.created_by_photo} alt={author} width={40} height={40} />
            )}
            <div>
              <div>
                <Link href={a.created_by ? `/author/${a.created_by}` : "#"}>{author}</Link>
              </div>
              <div>
                {a.category && <span>{a.category}</span>}
                {a.reading_time_minutes && <span> · {a.reading_time_minutes} мин чтения</span>}
              </div>
            </div>
          </div>
        </div>

        <div>
          <Link href={`/article/${a.slug}`}>{a.title || a.slug}</Link>
          {a.subtitle && <p>{a.subtitle}</p>}
        </div>

        {tags.length > 0 && (
          <div>
            {tags.map((t) => (
              <Link key={t} href={`/search?tag=${encodeURIComponent(t)}`}>#{t}</Link>
            ))}
          </div>
        )}

        <div>
          <div>
            <span>👁️ {a.views ?? 0}</span>
          </div>
          <div>
            <span>💬 {(a.comments_count ?? 0) || ""}</span>
          </div>
        </div>
      </div>
    </article>
  );
}


