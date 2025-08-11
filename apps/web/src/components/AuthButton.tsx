"use client";
import { useEffect, useState } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirebaseAuth, googleProvider, hasFirebaseEnv } from '@/lib/firebaseClient';

export default function AuthButton() {
  const envOk = hasFirebaseEnv();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    try {
      if (!envOk) return;
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(auth, setUser);
      // Обрабатываем возможный возврат из redirect-потока
      getRedirectResult(auth).catch(() => {});
      setAuthReady(true);
      return () => unsub();
    } catch (e) {
      /* noop */
    }
  }, [envOk]);

  async function handleLogin() {
    try {
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const anyE = e as { code?: string; message?: string } | undefined;
      const code = anyE?.code || 'unknown';
      const message = anyE?.message || '';
      // Частые нефатальные ошибки попапа: пробуем редирект вместо попапа
      const popupErrors = new Set([
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/operation-not-supported-in-this-environment',
      ]);
      if (popupErrors.has(code)) {
        try {
          const auth = getFirebaseAuth();
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {}
      }
      const dump = {
        apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      alert(`Не удалось выполнить вход.\nКод: ${code}\n${message}\nEnv: ${JSON.stringify(dump)}\n\nПроверьте: Google Sign-In включен, Authorized domains содержит localhost, .env.local заполнен и dev перезапущен.`);
    }
  }

  async function handleLogout() {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch {}
  }

  if (user && authReady) {
    return (
      <button onClick={handleLogout} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">
        Выйти ({user.displayName || user.email})
      </button>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleLogin}
        disabled={!envOk}
        className="px-3 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
      >
        Войти с Google
      </button>
      {!envOk && (
        <div className="text-xs text-gray-500">
          Firebase не настроен. Заполните `.env.local` и перезапустите dev.
        </div>
      )}
    </div>
  );
}


