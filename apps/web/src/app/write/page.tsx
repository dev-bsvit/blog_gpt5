"use client";
import { useEffect, useState } from "react";
import RichEditor from "@/components/RichEditor";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, hasFirebaseEnv } from "@/lib/firebaseClient";

export default function WritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("Технологии");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [readingMinutes, setReadingMinutes] = useState<string>("");
  const [publishNow, setPublishNow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!hasFirebaseEnv()) {
      router.replace("/login");
      return;
    }
    try {
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.replace("/login");
        } else {
          setAuthChecked(true);
        }
      });
      return () => unsub();
    } catch {
      router.replace("/login");
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiPost<{ slug: string }>("/articles", {
        title: title.trim() || "Untitled",
        subtitle: subtitle.trim(),
        content,
        is_published: publishNow,
        category,
        tags: tagsInput.split(',').map(s=>s.trim()).filter(Boolean),
        reading_time_minutes: readingMinutes.trim() ? Number(readingMinutes.trim()) : undefined,
      });
      router.push(`/article/${res.slug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-6">Написать статью</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Заголовок</label>
          <input
            className="w-full border rounded px-3 py-2 bg-transparent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок статьи"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
          Сразу опубликовать
        </label>
        <div>
          <label className="block text-sm mb-1">Подзаголовок</label>
          <input
            className="w-full border rounded px-3 py-2 bg-transparent"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Короткое описание"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Текст</label>
          <RichEditor value={content} onChange={setContent} placeholder="Черновик..." />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-1">Категория</label>
            <select className="w-full border rounded px-3 py-2 bg-transparent" value={category} onChange={(e)=>setCategory(e.target.value)}>
              <option>Технологии</option>
              <option>Дизайн</option>
              <option>Бизнес</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Теги (через запятую)</label>
            <input className="w-full border rounded px-3 py-2 bg-transparent" value={tagsInput} onChange={(e)=>setTagsInput(e.target.value)} placeholder="например: nextjs, fastapi" />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Время чтения (мин)</label>
            <input type="number" min={1} className="w-full border rounded px-3 py-2 bg-transparent" value={readingMinutes} onChange={(e)=>setReadingMinutes(e.target.value)} placeholder="напр. 5" />
          </div>
        </div>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {loading ? "Сохраняю..." : "Сохранить черновик"}
        </button>
      </form>
    </main>
  );
}



