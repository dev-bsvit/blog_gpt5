export function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  // Default to local Next.js API proxy if not provided
  const eff = (base && base.trim().length > 0) ? base : "/api/v1";
  return eff.replace(/\/$/, '');
}

async function withAuth(init?: RequestInit): Promise<RequestInit> {
  try {
    const { getFirebaseAuth } = await import('./firebaseClient');
    const { getIdToken } = await import('firebase/auth');
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await getIdToken(user, true);
      return { ...(init || {}), headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` } };
    }
  } catch {}
  return init || {};
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, await withAuth({
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  }));
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, await withAuth({
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  }));
  if (!res.ok) throw new Error(`POST ${path} ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPut<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, await withAuth({
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  }));
  if (!res.ok) throw new Error(`PUT ${path} ${res.status}`);
  return (await res.json()) as T;
}

export async function apiDelete(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${getApiBase()}${path}`, await withAuth({
    method: 'DELETE',
    headers: { ...(init?.headers || {}) },
  }));
  if (!res.ok && res.status !== 204) throw new Error(`DELETE ${path} ${res.status}`);
}



