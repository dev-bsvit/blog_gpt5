"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
  { key: "feed", label: "Лента", href: "/" },
  { key: "subs", label: "Подписки", href: "/?tab=subs" },
  { key: "fav", label: "Избранное", href: "/?tab=fav" },
];

export default function HomeTabs() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = pathname === "/" ? (sp.get("tab") || "feed") : "";
  return (
    <div className="rounded-3xl border border-divider bg-block shadow-1 pad-4d">
      <div className="flex items-center gap-3d">
        {tabs.map(t => (
          <Link key={t.key} href={t.href} className={`px-3d py-2d rounded-2xl border ty-body ${active===t.key?"border-brand text-brand":"border-divider"}`}>
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}


