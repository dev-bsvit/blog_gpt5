"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Tab = { key: string; label: string; href: string; icon: "home" | "star" | "users" };
const tabs: Tab[] = [
  { key: "feed", label: "Лента", href: "/", icon: "home" },
  { key: "fav", label: "Избранное", href: "/?tab=fav", icon: "star" },
  { key: "subs", label: "Подписки", href: "/?tab=subs", icon: "users" },
];

function Icon({ name, active }: { name: Tab["icon"]; active: boolean }) {
  const color = active ? "#292C32" : "#A4A8B2";
  if (name === "home") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" fill={color}/>
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M12 3l2.9 5.88 6.1.89-4.4 4.29 1.04 6.06L12 17.77 6.36 20.12 7.4 14.06 3 9.77l6.1-.89L12 3z" fill={color}/>
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 20a6 6 0 0 1 12 0v1H2v-1zm10 1v-1a6 6 0 0 1 10 0v1h-10z" fill={color}/>
    </svg>
  );
}

export default function HomeTabs() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = pathname === "/" ? (sp.get("tab") || "feed") : "";
  return (
    <div className="flex flex-col items-start rounded-[24px] bg-[#FFFFFF] w-[288px] h-[230px] p-[10px]">
      <nav className="flex flex-col gap-[10px]">
        {tabs.map(t => {
          const isActive = active === t.key;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`flex items-center gap-[10px] p-[10px] rounded-[8px] border ${isActive ? "text-[#292C32]" : "text-[#676E7E]"}`}
              style={{ borderColor: "#D1D3D8" }}
            >
              <Icon name={t.icon} active={isActive} />
              <span className="text-[16px] leading-[1.35]">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


