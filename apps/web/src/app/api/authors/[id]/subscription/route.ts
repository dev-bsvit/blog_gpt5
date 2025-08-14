/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { verifyRequestAuth } from '@/lib/apiAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, ctx: any) {
  const id = ctx?.params?.id as string;
  const db = getFirestore();
  const usersRef = db.collection('authors').doc(id).collection('subscriptions');
  let count = 0;
  try { const c = await usersRef.count().get(); count = c.data().count || 0; } catch {}
  return NextResponse.json({ subscribed: false, count }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request, ctx: any) {
  const id = ctx?.params?.id as string;
  let uid: string | undefined;
  try { uid = (await verifyRequestAuth(req)).uid; } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const db = getFirestore();
  const usersRef = db.collection('authors').doc(id).collection('subscriptions');
  const docRef = usersRef.doc(uid);
  const exists = (await docRef.get()).exists;
  if (exists) { await docRef.delete(); }
  else { await docRef.set({ uid, at: new Date().toISOString() }); }
  let count = 0;
  try { const c = await usersRef.count().get(); count = c.data().count || 0; } catch {}
  return NextResponse.json({ subscribed: !exists, count });
}


