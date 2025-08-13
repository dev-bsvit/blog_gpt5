"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const query = q.trim(); if (query) router.push(`/search?q=${encodeURIComponent(query)}`); }}
      className="hidden md:flex items-center rounded-2xl border border-divider bg-block px-4 py-2 w-full"
      role="search"
    >
      <input
        className="flex-1 bg-transparent outline-none ty-body"
        placeholder="Поиск"
        value={q}
        onChange={(e)=>setQ(e.target.value)}
        aria-label="Поиск"
      />
      <button type="submit" className="ml-2 px-3 py-1 rounded btn-secondary ty-body">Найти</button>
    </form>
  );
}


