/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function fetchFromUpstream(): Promise<Response> {
  const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
  if (!base) return NextResponse.json([], { status: 200 });
  try {
    const res = await fetch(`${base}/articles`, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json([], { status: 200 });
    const data = await res.json();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function GET() {
  try {
    const db = getFirestore();
    const snap = await db.collection('articles').orderBy('created_at', 'desc').get();
    const items: any[] = [];
    for (const d of snap.docs) {
      const data = d.data() || {};
      const slug = data.slug || d.id;
      let commentsCount = 0;
      if (typeof data.comments_count === 'number') {
        commentsCount = data.comments_count;
      } else {
        try {
          const cs = await db.collection('articles').doc(slug).collection('comments').count().get();
          commentsCount = cs.data().count || 0;
        } catch {
          commentsCount = 0;
        }
      }
      items.push({ ...data, comments_count: commentsCount });
    }
    if (items.length === 0) {
      // Fallback to upstream if local store is empty (e.g., not yet migrated)
      return fetchFromUpstream();
    }
    return NextResponse.json(items, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } });
  } catch {
    // Fallback to legacy upstream if Firestore not configured
    return fetchFromUpstream();
  }
}


