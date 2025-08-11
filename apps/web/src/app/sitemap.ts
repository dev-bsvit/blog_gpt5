import type { MetadataRoute } from 'next';

type Article = { slug: string; is_published?: boolean; updated_at?: string; created_at?: string };

async function fetchArticles(): Promise<Article[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  if (!base) return [];
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/articles`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()) as Article[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const items: MetadataRoute.Sitemap = [
    { url: `${site}/`, lastModified: new Date() },
  ];
  const articles = (await fetchArticles()).filter(a => a.is_published !== false);
  for (const a of articles) {
    items.push({
      url: `${site}/article/${a.slug}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : (a.created_at ? new Date(a.created_at) : new Date()),
    });
  }
  return items;
}


