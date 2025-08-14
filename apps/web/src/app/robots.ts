import type { MetadataRoute } from 'next';
export const runtime = 'nodejs';

export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${site}/sitemap.xml`,
  };
}


