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
  try { await ref.update({ views: (data.views || 0) + 1 }); } catch {}
  return NextResponse.json({ ...data, views: (data.views || 0) + 1 }, { headers: { 'Cache-Control': 'no-store' } });
}


