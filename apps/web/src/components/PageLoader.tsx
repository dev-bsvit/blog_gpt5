"use client";
import { useEffect, useState } from "react";

export default function PageLoader({ active, delay = 350, message }: { active: boolean; delay?: number; message?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);

  if (!show) return null;
  return (
    <div className="flex items-center gap-3 text-sm text-gray-400">
      <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      <span>{message || "Загрузка…"}</span>
    </div>
  );
}


