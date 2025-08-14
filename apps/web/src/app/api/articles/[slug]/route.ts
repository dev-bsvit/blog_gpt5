/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, ctx: any) {
  const slug = ctx?.params?.slug as string;
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  try {
    const db = getFirestore();
    const ref = db.collection('articles').doc(slug);
    const doc = await ref.get();
    if (!doc.exists) throw new Error('notfound');
    const data = doc.data() || {};
    try { await ref.update({ views: (data.views || 0) + 1 }); } catch {}
    return NextResponse.json({ ...data, views: (data.views || 0) + 1 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
    if (!base) return NextResponse.json({ error: 'not found' }, { status: 404 });
    try {
      const res = await fetch(`${base}/articles/${slug}`, { cache: 'no-store' });
      if (!res.ok) return NextResponse.json({ error: 'not found' }, { status: 404 });
      const j = await res.json();
      return NextResponse.json(j, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
  }
}


