"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopProgressBar({ height = 5, color = undefined as string | undefined }: { height?: number; color?: string }) {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Skip first render
    if (prev.current === null) { prev.current = pathname; return; }
    if (prev.current !== pathname) {
      prev.current = pathname;
      // start
      setVisible(true);
      setProgress(10);
      // mid progress
      const t1 = setTimeout(() => setProgress(55), 120);
      const t2 = setTimeout(() => setProgress(85), 240);
      // finish
      const t3 = setTimeout(() => {
        setProgress(100);
        setTimeout(() => { setVisible(false); setProgress(0); }, 220);
      }, 480);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [pathname]);

  if (!visible) return null;

  const barColor = color || (typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue("--strokeBrand") : "#ff5000");
  return (
    <div className="absolute bottom-0 left-0 w-full" style={{ height }}>
      <div
        className="h-full transition-all ease-out"
        style={{ width: `${progress}%`, backgroundColor: barColor.trim() }}
      />
    </div>
  );
}


