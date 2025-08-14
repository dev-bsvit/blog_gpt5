/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';

export async function GET(_: Request, ctx: any) {
  const slug = ctx?.params?.slug as string;
  const db = getFirestore();
  const ref = db.collection('articles').doc(slug);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
  // No per-user check here (client shows only icon state when authed)
  return NextResponse.json({ bookmarked: false }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(_: Request, ctx: any) {
  const slug = ctx?.params?.slug as string;
  const db = getFirestore();
  const ref = db.collection('articles').doc(slug);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
  // Stub toggle without auth for now; always return true
  return NextResponse.json({ bookmarked: true });
}


