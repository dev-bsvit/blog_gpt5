/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { verifyRequestAuth } from '@/lib/apiAuth';

export async function GET(req: Request) {
  let uid: string | undefined;
  try { uid = (await verifyRequestAuth(req)).uid; } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const db = getFirestore();
  const slugsSnap = await db.collection('users').doc(uid).collection('bookmarks').get();
  const slugs = slugsSnap.docs.map(d => d.id);
  const items: any[] = [];
  for (const slug of slugs) {
    const doc = await db.collection('articles').doc(slug).get();
    if (!doc.exists) continue;
    const data = doc.data() || {};
    let cc = 0;
    if (typeof data.comments_count === 'number') cc = data.comments_count;
    else {
      try { const c = await db.collection('articles').doc(slug).collection('comments').count().get(); cc = c.data().count || 0; } catch {}
    }
    items.push({ ...data, comments_count: cc });
  }
  items.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  return NextResponse.json(items);
}


