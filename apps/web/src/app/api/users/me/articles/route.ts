/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { verifyRequestAuth } from '@/lib/apiAuth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  let uid: string | undefined;
  try { uid = (await verifyRequestAuth(req)).uid; } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const db = getFirestore();
  const snap = await db.collection('articles').where('created_by', '==', uid).orderBy('created_at', 'desc').get();
  const items = snap.docs.map(d => d.data());
  return NextResponse.json(items);
}


