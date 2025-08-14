"use client";
import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost, getApiBase } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function LikeButton({ slug, initialLikes, className, activeClassName }: { slug: string; initialLikes?: number | null; className?: string; activeClassName?: string }) {
  const [likes, setLikes] = useState<number | null>(typeof initialLikes === "number" ? initialLikes : null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionClaps, setSessionClaps] = useState(0);
  const confettiRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    async function fetchState(uid?: string | null) {
      try {
        if (!uid) {
          // Anonymous fast path without dynamic auth import
          const res = await fetch(`${getApiBase()}/articles/${slug}/likes`, {
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          });
          if (!res.ok) throw new Error("fail");
          const r = (await res.json()) as { likes: number; liked?: boolean };
          setLikes(r.likes);
          setLiked(Boolean(r.liked));
          return;
        }
        const headers: HeadersInit | undefined = { "X-User-Id": uid };
        const r = await apiGet<{ likes: number; liked?: boolean }>(`/articles/${slug}/likes`, { headers });
        setLikes(r.likes);
        setLiked(Boolean(r.liked));
      } catch {
        setLikes(0);
        setLiked(false);
      }
    }
    // Fast path: fetch immediately without waiting for Firebase Auth init
    // This quickly renders counts; later we'll refine with user context when ready
    fetchState(null).catch(() => {
      setLikes(0);
      setLiked(false);
    });
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (u) => {
        const uid = u?.uid || null;
        setUserId(uid);
        fetchState(uid);
      });
    } catch {
      // Already attempted anonymous fetch above; nothing else to do here
    }
    return () => { if (unsub) unsub(); };
  }, [slug]);

  async function like() {
    setSending(true);
    try {
      setError(null);
      // new: everyone can increment, infinite times per request; store only total on backend
      setLikes((n) => (n === null ? n : n + 1));
      setLiked(true);
      setSessionClaps((n) => n + 1);
      // micro-confetti
      try {
        const el = confettiRef.current;
        if (el) {
          el.classList.remove("boom");
          el.innerHTML = "";
          const pieces = 8;
          for (let i = 0; i < pieces; i++) {
            const p = document.createElement("i");
            const angle = (Math.PI * 2 * i) / pieces;
            const dist = 20 + Math.random() * 10;
            p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
            p.style.setProperty("--dy", `${-Math.sin(angle) * dist}px`);
            el.appendChild(p);
          }
          // force reflow
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions, @typescript-eslint/no-unsafe-member-access
          (el as unknown as { offsetHeight: number }).offsetHeight;
          el.classList.add("boom");
        }
      } catch {}
      const r = await apiPost<{ likes: number }>(`/articles/${slug}/likes/increment`, {});
      setLikes(r.likes);
    } catch (e) {
      setError("Не удалось поставить лайк");
    } finally {
      setSending(false);
    }
  }

  const tooltip = sessionClaps > 0 ? `+${sessionClaps}` : undefined;

  return (
    <button type="button" onClick={like} disabled={sending} className={`${className || ""} ${liked ? (activeClassName || "") : ""}`.trim()} style={{ position: "relative" }}>
      <span aria-hidden style={{ fontSize: 18, lineHeight: 1, display: "inline-block" }}>👋</span>
      {" "}{(likes ?? 1) >= 1000 ? `${Math.floor((likes ?? 1)/1000)}K` : (likes ?? 1)}
      <span ref={confettiRef} className="confetti" aria-hidden />
      {tooltip && (
        <span aria-hidden style={{
          position: "absolute",
          top: -26,
          left: -6,
          padding: "2px 6px",
          borderRadius: 9999,
          background: "#111",
          color: "#fff",
          fontSize: 12,
          opacity: 0.9,
          transform: "translateY(-6px)",
          animation: "fadeOut 1200ms var(--default-transition-timing-function) forwards"
        }}>{tooltip}</span>
      )}
    </button>
  );
}


