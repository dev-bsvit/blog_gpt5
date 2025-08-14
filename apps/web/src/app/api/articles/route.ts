/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const db = getFirestore();
    const snap = await db.collection('articles').orderBy('created_at', 'desc').get();
    const items: any[] = [];
    for (const d of snap.docs) {
      const data = d.data() || {};
      const slug = data.slug || d.id;
      // comments_count: denormalized preferred; fallback to counting subcollection
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
    return NextResponse.json(items, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } });
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}


