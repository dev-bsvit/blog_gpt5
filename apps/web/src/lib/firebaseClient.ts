import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Не блокируем инициализацию жёсткими проверками — Firebase сам вернёт понятную ошибку,
// а значения из .env.local будут инлайнены в сборку Next.

export function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig as Record<string, string | undefined>);
  }
  return getApp();
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return getAuth(app);
}

export const googleProvider = new GoogleAuthProvider();

export function hasFirebaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}


