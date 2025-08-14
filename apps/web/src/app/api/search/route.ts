/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  if (!q) return NextResponse.json([]);
  const db = getFirestore();
  const snap = await db.collection('articles').orderBy('created_at', 'desc').get();
  const items: any[] = [];
  for (const d of snap.docs) {
    const data = d.data() || {};
    const hay = `${data.title || ''}\n${data.subtitle || ''}\n${data.content || ''}`.toLowerCase();
    if (hay.includes(q)) items.push(data);
  }
  return NextResponse.json(items, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } });
}


