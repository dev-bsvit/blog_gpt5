"use client";
import Link from "next/link";
import s from "./ArticleCard.module.css";
import LikeButton from "./LikeButton";
import BookmarkButton from "./BookmarkButton";
import SubscribeButton from "./SubscribeButton";

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
    <article className={s.card}>
      <div className={s.coverWrap}>
        <Link href={`/article/${a.slug}`} style={{ color: "inherit", textDecoration: "none" }} className={s.cover}>
          {a.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.cover_url} alt={a.cover_alt || a.title || a.slug || "cover"} className={s.coverImg} />
          ) : null}
        </Link>
      </div>

      <div className={s.content}>
        <div className={s.authorRow}>
          <div className={s.authorLeft}>
            {a.created_by_photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.created_by_photo} alt={author} className={s.avatar} />
            )}
            <div>
              <div className={`ty-body ${s.name}`}>
                <Link href={a.created_by ? `/author/${a.created_by}` : "#"} style={{ color: "inherit", textDecoration: "none" }}>{author}</Link>
              </div>
              <div className={`ty-meta ${s.meta}`}>
                {a.category && <span>{a.category}</span>}
                {a.reading_time_minutes && <span> · {a.reading_time_minutes} мин чтения</span>}
              </div>
            </div>
          </div>
          <div>
            <SubscribeButton authorId={a.created_by} className={s.subscribe} />
          </div>
        </div>

        <div className={s.title}>
          <Link href={`/article/${a.slug}`} style={{ color: "inherit", textDecoration: "none" }} className="ty-h3">{a.title || a.slug}</Link>
          {a.subtitle && <p className={`ty-subtitle ${s.subtitle}`}>{a.subtitle}</p>}
        </div>

        <div className={s.likeRow}>
          <LikeButton slug={a.slug} className={s.likeBtn} activeClassName={s.likeActive} />
        </div>

        {tags.length > 0 && (
          <div className={s.tags + " ty-meta"}>
            {tags.map((t) => (
              <Link key={t} href={`/search?tag=${encodeURIComponent(t)}`} className="underline decoration-transparent hover:decoration-inherit">#{t}</Link>
            ))}
          </div>
        )}

        <div className={s.bottom}>
          <div className={s.metricGroup}>
            <span className={s.metric}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="currentColor"/>
              </svg>
              {a.views ?? 0}
            </span>
          </div>
          <div className={s.metricGroup}>
            <span className={s.metric}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M21 6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3l4 4 4-4h3a2 2 0 0 0 2-2V6z" fill="currentColor"/>
              </svg>
              {(a.comments_count ?? 0) > 0 ? (a.comments_count as number) : null}
            </span>
            <BookmarkButton slug={a.slug} className={s.bookmark} activeClassName={s.bookmarkActive} />
          </div>
        </div>
      </div>
    </article>
  );
}


