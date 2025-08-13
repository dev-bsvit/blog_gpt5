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
    } catch {
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

  const avatarUrl = user?.photoURL || "";
  const initials = (user?.displayName || user?.email || "").trim().slice(0,1).toUpperCase();
  const isAuthed = Boolean(user && authReady);
  return (
    <button
      onClick={isAuthed ? handleLogout : handleLogin}
      disabled={!envOk && !isAuthed}
      title={isAuthed ? (user?.displayName || user?.email || "Выход") : "Войти"}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-divider bg-secondary-block overflow-hidden"
    >
      {isAuthed ? (
        avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-secondary">{initials || ""}</span>
        )
      ) : (
        <span className="block w-6 h-6 rounded-full bg-tertiary-block" />
      )}
    </button>
  );
}


