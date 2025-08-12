"use client";
import useSWR from "swr";

type NewsItem = { title: string; created_at?: string };

function formatRelative(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч`;
  return date.toLocaleDateString();
}

export default function NewsList() {
  const { data } = useSWR<NewsItem[]>("/articles", null, { suspense: false });
  const items = Array.isArray(data) ? data.slice(0, 6) : [];
  return (
    <aside className="rounded-3xl border border-divider bg-block shadow-1 pad-4d">
      <div className="flex items-center justify-between mb-3d">
        <h2 className="ty-h3">Новости</h2>
        <a className="ty-meta underline" href="#">Все</a>
      </div>
      <ul className="flex flex-col gap-3d">
        {items.map((n) => (
          <li key={n.title}>
            <div className="ty-meta">{formatRelative(n.created_at)}</div>
            <div className="ty-title">{n.title}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
}


