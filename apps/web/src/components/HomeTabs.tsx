"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
  { key: "feed", label: "Лента", href: "/", icon: "🏠" },
  { key: "fav", label: "Избранное", href: "/?tab=fav", icon: "⭐" },
  { key: "subs", label: "Подписки", href: "/?tab=subs", icon: "👥" },
];

export default function HomeTabs() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = pathname === "/" ? (sp.get("tab") || "feed") : "";
  return (
    <div className="rounded-3xl border border-divider bg-block shadow-1 pad-4d">
      <nav className="flex flex-col gap-3d">
        {tabs.map(t => (
          <Link key={t.key} href={t.href} className={`flex items-center gap-2d px-3d py-2d rounded-2xl border ty-body ${active===t.key?"border-brand text-brand":"border-divider"}`}>
            <span aria-hidden>{t.icon}</span>
            <span>{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}


