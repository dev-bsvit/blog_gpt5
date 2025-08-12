"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function EditOwnerLink({ slug, createdBy }: { slug: string; createdBy?: string }) {
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(auth, (u) => {
        const uid = u?.uid || null;
        setIsOwner(Boolean(uid && createdBy && uid === createdBy));
      });
      return () => unsub();
    } catch {
      setIsOwner(false);
    }
  }, [createdBy]);

  if (!isOwner) return null;
  return <Link className="underline" href={`/article/${slug}/edit`}>Редактировать</Link>;
}


