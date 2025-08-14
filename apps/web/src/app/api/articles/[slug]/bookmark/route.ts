/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { verifyRequestAuth } from '@/lib/apiAuth';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: any) {
  const slug = ctx?.params?.slug as string;
  const db = getFirestore();
  const aref = db.collection('articles').doc(slug);
  const doc = await aref.get();
  if (!doc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
  let uid: string | undefined;
  try { uid = (await verifyRequestAuth(req)).uid; } catch {}
  if (!uid) return NextResponse.json({ bookmarked: false }, { headers: { 'Cache-Control': 'no-store' } });
  const exists = (await aref.collection('bookmarks').doc(uid).get()).exists;
  return NextResponse.json({ bookmarked: exists }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request, ctx: any) {
  const slug = ctx?.params?.slug as string;
  const db = getFirestore();
  const aref = db.collection('articles').doc(slug);
  const doc = await aref.get();
  if (!doc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
  let uid: string;
  try { uid = (await verifyRequestAuth(req)).uid; } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const aUser = aref.collection('bookmarks').doc(uid);
  const uRef = db.collection('users').doc(uid).collection('bookmarks').doc(slug);
  const exists = (await aUser.get()).exists;
  if (exists) {
    await aUser.delete();
    await uRef.delete();
    return NextResponse.json({ bookmarked: false });
  } else {
    await aUser.set({ uid, at: new Date().toISOString() });
    await uRef.set({ slug, at: new Date().toISOString() });
    return NextResponse.json({ bookmarked: true });
  }
}


