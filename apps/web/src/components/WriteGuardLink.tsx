"use client";
import { useEffect, useState } from "react";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { useRouter } from "next/navigation";
import { getFirebaseAuth, googleProvider } from "@/lib/firebaseClient";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";

export default function WriteGuardLink() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid || null));
      return () => unsub();
    } catch { setUid(null); }
  }, []);

  async function go() {
    if (uid) { router.push("/write"); return; }
    setOpen(true);
  }

  async function doLogin() {
    try {
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, googleProvider);
      router.push("/write");
    } catch {
      setOpen(false);
    }
  }

  return (
    <>
      <RainbowButton onClick={go} className="h-10 px-6" aria-label="Написать пост">Написать</RainbowButton>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl bg-zinc-900 p-5 border border-white/10 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Нужна авторизация</h3>
            <p className="text-sm text-gray-400 mb-4">Чтобы написать статью, войдите через Google.</p>
            <div className="flex items-center justify-end gap-2">
              <button className="px-3 py-2 rounded bg-zinc-700" onClick={()=>setOpen(false)}>Отмена</button>
              <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={doLogin}>Войти с Google</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


