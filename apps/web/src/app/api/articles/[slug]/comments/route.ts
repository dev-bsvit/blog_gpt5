/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { verifyRequestAuth } from '@/lib/apiAuth';

export const runtime = 'nodejs';

export async function GET(_: Request, ctx: any) {
  const slug = ctx?.params?.slug as string;
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const db = getFirestore();
  const art = await db.collection('articles').doc(slug).get();
  if (!art.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const snap = await db.collection('articles').doc(slug).collection('comments').orderBy('created_at', 'desc').get();
  const items = snap.docs.map(d => d.data());
  return NextResponse.json(items, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request, ctx: any) {
  const slug = ctx?.params?.slug as string;
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  let author: string | undefined;
  try {
    const claims = await verifyRequestAuth(req);
    author = claims.name || claims.email || claims.uid;
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });
  const db = getFirestore();
  const ref = db.collection('articles').doc(slug);
  if (!(await ref.get()).exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const id = Date.now().toString();
  const c = { id, text, author: author || 'User', created_at: new Date().toISOString() };
  await ref.collection('comments').doc(id).set(c);
  // optional: denormalize comments_count
  try { await ref.update({ comments_count: (Number((await ref.get()).data()?.comments_count || 0) + 1) }); } catch {}
  return NextResponse.json(c, { status: 201 });
}


