import HomeClient from "@/components/HomeClient";

export const revalidate = 30;

export default async function Home() {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  if (!base) {
    return <HomeClient initialArticles={[]} initialHealth={"unknown"} />;
  }
  try {
    const [healthRes, listRes] = await Promise.all([
      fetch(`${base}/articles/health`, { next: { revalidate } }),
      fetch(`${base}/articles`, { next: { revalidate } }),
    ]);
    const health = await healthRes.json();
    const list = await listRes.json();
    return <HomeClient initialArticles={list} initialHealth={health?.status || "ok"} />;
  } catch {
    return <HomeClient initialArticles={[]} initialHealth={"unknown"} />;
  }
}
