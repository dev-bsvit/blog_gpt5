"use client";
import { useEffect, useState } from "react";
import { apiDelete, apiPut } from "@/lib/api";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function PublishControls({ slug, isPublished, createdBy }: { slug: string; isPublished?: boolean; createdBy?: string }) {
  const [uid, setUid] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      return onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    } catch {
      setUid(null);
    }
  }, []);

  const isOwner = uid && createdBy && uid === createdBy;
  if (!isOwner) return null;

  async function publish() {
    setSending(true);
    try {
      await apiPut(`/articles/${slug}`, { is_published: true });
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function unpublish() {
    setSending(true);
    try {
      await apiPut(`/articles/${slug}`, { is_published: false });
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function remove() {
    if (!confirm("Удалить статью безвозвратно?")) return;
    setSending(true);
    try {
      await apiDelete(`/articles/${slug}`);
      router.push("/");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pt-2 flex items-center gap-2">
      {!isPublished ? (
        <button onClick={publish} disabled={sending} className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50">
          {sending ? "Публикую..." : "Опубликовать"}
        </button>
      ) : (
        <button onClick={unpublish} disabled={sending} className="px-3 py-2 rounded bg-yellow-700 text-white disabled:opacity-50">
          {sending ? "Сохраняю..." : "Снять с публикации"}
        </button>
      )}
      <button onClick={remove} disabled={sending} className="px-3 py-2 rounded bg-red-700 text-white disabled:opacity-50">
        {sending ? "Удаляю..." : "Удалить"}
      </button>
    </div>
  );
}


