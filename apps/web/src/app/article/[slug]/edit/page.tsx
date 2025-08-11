"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiDelete, apiGet, apiPut } from "@/lib/api";
import RichEditor from "@/components/RichEditor";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, hasFirebaseEnv } from "@/lib/firebaseClient";

type Article = {
  slug: string;
  title?: string;
  subtitle?: string;
  content?: string;
  is_published?: boolean;
  category?: string;
  tags?: string[];
  reading_time_minutes?: number;
};

export default function EditArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [category, setCategory] = useState<string>("Технологии");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [readingMinutes, setReadingMinutes] = useState<string>("");

  useEffect(() => {
    if (!hasFirebaseEnv()) {
      router.replace("/login");
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const a = await apiGet<Article>(`/articles/${slug}`);
        setTitle(a.title || "");
        setSubtitle(a.subtitle || "");
        setContent(a.content || "");
        setIsPublished(a.is_published !== false);
        setCategory(a.category || "Технологии");
        setTagsInput(Array.isArray(a.tags) ? a.tags.join(', ') : "");
        setReadingMinutes(a.reading_time_minutes ? String(a.reading_time_minutes) : "");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg || "Не удалось загрузить статью");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router, slug]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await apiPut<Article>(`/articles/${slug}`, {
        title: title.trim() || "Untitled",
        subtitle: subtitle.trim(),
        content,
        is_published: isPublished,
        category,
        tags: tagsInput.split(',').map(s=>s.trim()).filter(Boolean),
        reading_time_minutes: readingMinutes.trim() ? Number(readingMinutes.trim()) : undefined,
      });
      if (updated.is_published === false) {
        router.push(`/article/${slug}/edit`);
      } else {
        router.push(`/article/${slug}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Удалить статью?")) return;
    setDeleting(true);
    setError("");
    try {
      await apiDelete(`/articles/${slug}`);
      router.replace("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-6">Редактировать статью</h1>
      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Заголовок</label>
          <input className="w-full border rounded px-3 py-2 bg-transparent" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Подзаголовок</label>
          <input className="w-full border rounded px-3 py-2 bg-transparent" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Текст</label>
          <RichEditor value={content} onChange={setContent} />
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
            <input className="w-full border rounded px-3 py-2 bg-transparent" value={tagsInput} onChange={(e)=>setTagsInput(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Время чтения (мин)</label>
            <input type="number" min={1} className="w-full border rounded px-3 py-2 bg-transparent" value={readingMinutes} onChange={(e)=>setReadingMinutes(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          Публикована
        </label>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
            {saving ? "Сохраняю..." : "Сохранить"}
          </button>
          <button type="button" onClick={onDelete} disabled={deleting} className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50">
            {deleting ? "Удаляю..." : "Удалить"}
          </button>
        </div>
      </form>
    </main>
  );
}


