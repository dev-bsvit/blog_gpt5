"use client";
import LikeButton from "./LikeButton";
import BookmarkButton from "./BookmarkButton";
import SubscribeButton from "./SubscribeButton";
import Link from "next/link";
import Image from "next/image";
import s from "./ArticleCard.module.css";

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
        <Link href={`/article/${a.slug}`} className={s.cover}>
          {a.cover_url ? (
            <Image src={a.cover_url} alt={a.cover_alt || a.title || a.slug || "cover"} fill sizes="(max-width: 768px) 100vw, 720px" className={s.coverImg} />
          ) : (
            <div className="absolute inset-0 bg-tertiary-block" />
          )}
        </Link>
      </div>

      <div className={s.content}>
        <div className={s.authorRow}>
          <div className={s.authorLeft}>
            <div className={s.avatarWrap} aria-hidden>
              {a.created_by_photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.created_by_photo} alt={author} className={s.avatar} />
              )}
            </div>
            <div>
              <div className={`ty-body ${s.name}`}>
                <Link href={a.created_by ? `/author/${a.created_by}` : "#"} className="underline decoration-transparent hover:decoration-inherit">
                  {author}
                </Link>
              </div>
              <div className={`ty-meta ${s.meta}`}>
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

        <div className={s.title}>
          <Link href={`/article/${a.slug}`} className="ty-h3 underline decoration-transparent hover:decoration-inherit">
            {a.title || a.slug}
          </Link>
        </div>
        {a.subtitle && (
          <p className={`ty-subtitle ${s.subtitle}`}>{a.subtitle}</p>
        )}

        <div className={s.likeRow}>
          <LikeButton slug={a.slug} />
        </div>

        {(tags.length > 0) && (
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
            <span className={s.bookmarkBtn}>
              <BookmarkButton slug={a.slug} />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}


