"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

export default function SubscribeButton({ authorId }: { authorId?: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!authorId) return;
    apiGet<{ subscribed: boolean; count: number }>(`/authors/${authorId}/subscription`).then(r => {
      setSubscribed(Boolean(r.subscribed));
      setCount(Number(r.count || 0));
    }).catch(() => {
      setSubscribed(false);
      setCount(null);
    });
  }, [authorId]);

  async function toggle() {
    if (!authorId) return;
    setLoading(true);
    try {
      // optimistic
      setSubscribed((v) => !v);
      setCount((n) => (n === null ? n : (subscribed ? (n - 1) : (n + 1))));
      const r = await apiPost<{ subscribed: boolean; count: number }>(`/authors/${authorId}/subscription`, {});
      setSubscribed(Boolean(r.subscribed));
      setCount(Number(r.count || 0));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`px-2 py-1 rounded text-xs ${subscribed ? "bg-emerald-700 text-white" : "bg-zinc-700 text-white"} disabled:opacity-50`}
      title={authorId ? `Автор: ${authorId}` : undefined}
    >
      {subscribed ? "✓ Подписан" : "+ Подписаться"}{count !== null ? ` (${count})` : ""}
    </button>
  );
}


