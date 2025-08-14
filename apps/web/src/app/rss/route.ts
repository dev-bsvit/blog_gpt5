import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

type Article = { slug: string; title?: string; subtitle?: string; content?: string; is_published?: boolean; created_at?: string; updated_at?: string };

async function fetchArticles(): Promise<Article[]> {
  try {
    const res = await fetch(`/api/articles`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()) as Article[];
  } catch {
    return [];
  }
}

export async function GET() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const items = (await fetchArticles()).filter(a => a.is_published !== false);
  const xmlItems = items.map((a) => `
    <item>
      <title>${escapeXml(a.title || a.slug)}</title>
      <link>${site}/article/${a.slug}</link>
      <guid>${site}/article/${a.slug}</guid>
      <pubDate>${new Date(a.created_at || Date.now()).toUTCString()}</pubDate>
      <description>${escapeXml(a.subtitle || '')}</description>
    </item>
  `).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Blog MVP RSS</title>
      <link>${site}</link>
      <description>Последние статьи</description>
      ${xmlItems}
    </channel>
  </rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


