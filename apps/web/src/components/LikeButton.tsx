"use client";
import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function LikeButton({ slug, className, activeClassName }: { slug: string; className?: string; activeClassName?: string }) {
  const [likes, setLikes] = useState<number | null>(null);
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
        const headers: HeadersInit | undefined = uid ? { "X-User-Id": uid } : undefined;
        const r = await apiGet<{ likes: number; liked?: boolean }>(`/articles/${slug}/likes`, { headers });
        setLikes(r.likes);
        setLiked(Boolean(r.liked));
      } catch {
        setLikes(0);
        setLiked(false);
      }
    }
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (u) => {
        const uid = u?.uid || null;
        setUserId(uid);
        fetchState(uid);
      });
    } catch {
      fetchState(null);
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

  const tooltip = sessionClaps > 0 ? `Ваши лайки за сессию: ${sessionClaps}` : undefined;

  return (
    <button type="button" onClick={like} disabled={sending} title={tooltip || "Поставить лайк"} className={`${className || ""} ${liked ? (activeClassName || "") : ""}`.trim()} style={{ position: "relative" }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-label="clap">
        <path fillRule="evenodd" d="M11.37.828 12 3.282l.63-2.454zM15.421 1.84l-1.185-.388-.338 2.5zM9.757 1.452l-1.184.389 1.523 2.112zM20.253 11.84 17.75 7.438c-.238-.353-.57-.584-.93-.643a.96.96 0 0 0-.753.183 1.13 1.13 0 0 0-.443.695c.014.019.03.033.044.053l2.352 4.138c1.614 2.95 1.1 5.771-1.525 8.395a7 7 0 0 1-.454.415c.997-.13 1.927-.61 2.773-1.457 2.705-2.704 2.517-5.585 1.438-7.377M12.066 9.01c-.129-.687.08-1.299.573-1.773l-2.062-2.063a1.123 1.123 0 0 0-1.555 0 1.1 1.1 0 0 0-.273.521z" clipRule="evenodd"></path>
        <path fillRule="evenodd" d="M14.741 8.309c-.18-.267-.446-.455-.728-.502a.67.67 0 0 0-.533.127c-.146.113-.59.458-.199 1.296l1.184 2.503a.448.448 0 0 1-.236.755.445.445 0 0 1-.483-.248L7.614 6.106A.816.816 0 1 0 6.459 7.26l3.643 3.644a.446.446 0 1 1-.631.63L5.83 7.896l-1.03-1.03a.82.82 0 0 0-1.395.577.81.81 0 0 0 .24.576l1.027 1.028 3.643 3.643a.444.444 0 0 1-.144.728.44.44 0 0 1-.486-.098l-3.64-3.64a.82.82 0 0 0-1.335.263.81.81 0 0 0 .178.89л1.535 1.534 2.287 2.288a.445.445 0 0 1-.63.63l-2.287-2.288a.813.813 0 0 0-1.393.578c0 .216.086.424.238.577л4.403 4.403c2.79 2.79 5.495 4.119 8.681.931 2.269-2.271 2.708-4.588 1.342-7.086z" clipRule="evenodd"></path>
      </svg>
      {" "}{(likes ?? 1) >= 1000 ? `${Math.floor((likes ?? 1)/1000)}K` : (likes ?? 1)}
      <span ref={confettiRef} className="confetti" aria-hidden />
    </button>
  );
}


