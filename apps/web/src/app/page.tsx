import HomeClient from "@/components/HomeClient";

export const revalidate = 30;

export default async function Home() {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE is not set");
  const [healthRes, listRes] = await Promise.all([
    fetch(`${base}/articles/health`, { next: { revalidate } }),
    fetch(`${base}/articles`, { next: { revalidate } }),
  ]);
  const health = await healthRes.json();
  const list = await listRes.json();
  return <HomeClient initialArticles={list} initialHealth={health?.status || "ok"} />;
}
