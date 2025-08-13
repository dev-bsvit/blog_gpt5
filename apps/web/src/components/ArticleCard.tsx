"use client";
import Link from "next/link";
import s from "./ArticleCard.module.css";
import LikeButton from "./LikeButton";
import SubscribeButton from "./SubscribeButton";
import BookmarkButton from "./BookmarkButton";
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
    <article className={s.articleCard}>
      {a.cover_url && (
        <div className={s.coverWrap}>
          <Link href={`/article/${a.slug}`} style={{ color: "inherit", textDecoration: "none" }} className={s.cover}>
            <Image src={a.cover_url} alt={a.cover_alt || a.title || a.slug || "cover"} fill sizes="(max-width: 768px) 100vw, 50vw" className={s.coverImg} />
          </Link>
        </div>
      )}
      <div className={s.cardHeader}>
        <div className={s.authorInfo}>
          {a.created_by_photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.created_by_photo} alt={author} className={s.avatar} />
          )}
          <div className={s.authorText}>
            <span className={s.authorName}>
              <Link href={a.created_by ? `/author/${a.created_by}` : "#"} style={{ color: "inherit", textDecoration: "none" }}>{author}</Link>
            </span>
            <div className={s.metaRow}>
              {a.category && <span className={s.category}>{a.category}</span>}
              {a.category && a.reading_time_minutes ? <span className={s.separator}>·</span> : null}
              {a.reading_time_minutes ? <span className={s.readingTime}>{a.reading_time_minutes} мин чтения</span> : null}
            </div>
          </div>
        </div>
        <SubscribeButton authorId={a.created_by} className={s.subscribeBtn} activeClassName={s.subscribeActive} />
      </div>

      <h2 className={s.articleTitle}>
        <Link href={`/article/${a.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{a.title || a.slug}</Link>
      </h2>
      {a.subtitle && <p className={s.articleDescription}>{a.subtitle}</p>}

      {tags.length > 0 && (
        <div className={s.tagsContainer}>
          {tags.map((t) => (
            <Link key={t} href={`/search?tag=${encodeURIComponent(t)}`} className={s.tag}>#{t}</Link>
          ))}
        </div>
      )}

      <div className={s.interactionBar}>
        <div className={s.interactionLeft}>
          <LikeButton slug={a.slug} className={s.likeButton} activeClassName={s.likeButtonActive} />
        </div>
        <div className={s.interactionRight}>
          <div className={s.interactionItem}>
            <svg viewBox="0 0 24 24" className={s.interactionIcon} aria-hidden>
              <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="currentColor"/>
            </svg>
            <span>{a.views ?? 0}</span>
          </div>
          <div className={s.interactionItem}>
            <svg viewBox="0 0 24 24" className={s.interactionIcon} aria-hidden>
              <path d="M21 6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3l4 4 4-4h3a2 2 0 0 0 2-2V6z" fill="currentColor"/>
            </svg>
            <span>{a.comments_count ?? 0}</span>
          </div>
          <BookmarkButton slug={a.slug} className={s.bookmark} activeClassName={s.bookmarkActive} />
        </div>
      </div>
    </article>
  );
}


