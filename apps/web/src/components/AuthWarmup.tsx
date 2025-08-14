"use client";
import { useEffect } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { apiGet } from "@/lib/api";
import { mutate as swrMutate } from "swr";

export default function AuthWarmup() {
  useEffect(() => {
    const storageKey = "bk_slugs";
    let unsub: undefined | (() => void);
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, async (u) => {
        if (!u) return;
        try {
          const list = await apiGet<{ slugs: string[] }>(`/users/me/bookmarks/slugs`);
          const slugs = Array.isArray(list.slugs) ? list.slugs : [];
          try { localStorage.setItem(storageKey, JSON.stringify(slugs)); } catch {}
          swrMutate(`/users/me/bookmarks/slugs`, { slugs }, { revalidate: false });
        } catch {}
      });
    } catch {}
    return () => { if (unsub) unsub(); };
  }, []);
  return null;
}


