/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(_: Request, ctx: any) {
  const slug = ctx?.params?.slug as string;
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const db = getFirestore();
  const ref = db.collection('articles').doc(slug);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const data = doc.data() || {};
  let likes = Number(data.likes || 0);
  // fallback count if field missing
  if (!likes) {
    try {
      const cnt = await ref.collection('likes').count().get();
      likes = cnt.data().count || 0;
    } catch {}
  }
  return NextResponse.json({ likes }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(_: Request, ctx: any) {
  const slug = ctx?.params?.slug as string;
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const db = getFirestore();
  const ref = db.collection('articles').doc(slug);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
  try { await ref.update({ likes: (doc.data()?.likes || 0) + 1 }); } catch {}
  const newDoc = await ref.get();
  return NextResponse.json({ likes: Number(newDoc.data()?.likes || 0) });
}


