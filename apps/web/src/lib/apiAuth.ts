import { getAuth } from '@/lib/firebaseAdmin';

export type AuthClaims = { uid: string; user_id?: string; email?: string; name?: string; picture?: string };

export async function verifyRequestAuth(req: Request): Promise<AuthClaims> {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    throw new Error('unauthorized');
  }
  const token = authHeader.split(' ', 2)[1].trim();
  const auth = getAuth();
  const decoded = await auth.verifyIdToken(token);
  return decoded as unknown as AuthClaims;
}


