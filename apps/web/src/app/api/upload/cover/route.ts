/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { verifyRequestAuth } from '@/lib/apiAuth';

function getBucketName(): string {
  return process.env.FIREBASE_STORAGE_BUCKET || process.env.GCS_BUCKET || '';
}

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let uid: string | undefined;
  try { uid = (await verifyRequestAuth(req)).uid; } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const alt = String(form.get('alt') || '').trim();
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });
  if (alt.length < 10 || alt.length > 140) return NextResponse.json({ error: 'alt length 10-140 required' }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const bucketName = getBucketName();
  if (!bucketName) return NextResponse.json({ error: 'bucket not set' }, { status: 500 });
  const storage = new Storage();
  const safeName = (file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectName = `covers/${uid}/${Date.now()}_${safeName}`;
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(objectName);
  await blob.save(buf, { contentType: file.type, public: true, resumable: false, metadata: { cacheControl: 'public, max-age=31536000, immutable' } });
  const url = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(objectName)}`;
  return NextResponse.json({ url, alt });
}


