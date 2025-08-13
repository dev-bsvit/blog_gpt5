"use client";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";

export default function DraftsLink() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); });
    } catch {
      setUser(null);
      setReady(true);
    }
    return () => { if (unsub) unsub(); };
  }, []);

  // Показываем ссылку всем авторизованным пользователям, чтобы проще было найти свои черновики
  if (!ready || !user) return null;

  return (
    <a href="/drafts" title="Черновики" className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] border border-divider bg-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://firebasestorage.googleapis.com/v0/b/blog-5gpt.firebasestorage.app/o/Logo_graf%2Fedit%205.svg?alt=media&token=fb120dbc-3d73-484c-b60d-3ae665ceca51"
        alt="Черновики"
        width={24}
        height={24}
      />
    </a>
  );
}


