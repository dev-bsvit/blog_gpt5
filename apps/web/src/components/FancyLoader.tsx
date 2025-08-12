"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function FancyLoader({ active = false, route = false, duration = 600 }: { active?: boolean; route?: boolean; duration?: number }) {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);
  const [show, setShow] = useState(false);

  // Show on route change (simple heuristic for App Router)
  useEffect(() => {
    if (!route) return;
    if (prev.current === null) {
      prev.current = pathname;
      return;
    }
    if (prev.current !== pathname) {
      prev.current = pathname;
      setShow(true);
      const t = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(t);
    }
  }, [pathname, route, duration]);

  // External control
  useEffect(() => {
    setShow((s) => (active ? true : s && route));
    if (!active) return;
    const t = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(t);
  }, [active, duration, route]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-white/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin" style={{ animationDuration: "900ms" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse { 0%,100%{opacity:.4; transform:scale(.9)} 50%{opacity:1; transform:scale(1)} }
      `}</style>
    </div>
  );
}


