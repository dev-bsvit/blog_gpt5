/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { verifyRequestAuth } from '@/lib/apiAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  let uid: string | undefined;
  try { uid = (await verifyRequestAuth(req)).uid; } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const db = getFirestore();
  const slSnap = await db.collection('users').doc(uid).collection('bookmarks').get();
  const slugs = slSnap.docs.map(d => d.id);
  return NextResponse.json({ slugs }, { headers: { 'Cache-Control': 'no-store' } });
}


