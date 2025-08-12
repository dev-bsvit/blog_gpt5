"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiDelete, apiGet, apiPut } from "@/lib/api";
import Image from "next/image";
import { getFirebaseAuth, hasFirebaseEnv } from "@/lib/firebaseClient";
import { getIdToken, onAuthStateChanged } from "firebase/auth";
import RichEditor from "@/components/RichEditor";

type Article = {
  slug: string;
  title?: string;
  subtitle?: string;
  content?: string;
  is_published?: boolean;
  category?: string;
  tags?: string[];
  reading_time_minutes?: number;
  cover_url?: string;
  cover_alt?: string;
  cover_caption?: string;
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
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverAlt, setCoverAlt] = useState<string>("");
  const [coverCaption, setCoverCaption] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

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
        setCoverUrl(a.cover_url || "");
        setCoverAlt(a.cover_alt || "");
        setCoverCaption(a.cover_caption || "");
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
        cover_url: coverUrl || undefined,
        cover_alt: coverAlt || undefined,
        cover_caption: coverCaption || undefined,
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

  async function onCoverChange(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("alt", coverAlt || (title || slug));
    setUploading(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
      let headers: Record<string, string> | undefined = undefined;
      try {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        if (user) {
          const token = await getIdToken(user, true);
          headers = { Authorization: `Bearer ${token}` };
          form.append("user_id", user.uid);
        }
      } catch {}
      const res = await fetch(`${apiBase}/upload/cover`, { method: "POST", body: form, headers });
      if (!res.ok) throw new Error(`upload ${res.status}`);
      const data = await res.json();
      setCoverUrl(String(data.url || ""));
      setUploadError("");
    } finally {
      setUploading(false);
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

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Обложка</h3>
          {coverUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <div className="relative aspect-[16/9]">
                <Image src={coverUrl} alt={coverAlt || title || slug} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
              </div>
              <div className="p-2 flex gap-2">
                <button type="button" className="px-3 py-1 rounded bg-zinc-700 text-white" onClick={()=>{setCoverUrl("")}}>Удалить</button>
                <label className="px-3 py-1 rounded bg-zinc-700 text-white cursor-pointer">
                  Заменить<input type="file" className="hidden" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) onCoverChange(f);}} />
                </label>
              </div>
            </div>
          ) : (
            <label className="block border border-dashed rounded-xl p-6 text-center cursor-pointer">
              <div className="text-sm">Перетащите файл или нажмите для выбора</div>
              <input type="file" className="hidden" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) onCoverChange(f);}} />
            </label>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Alt‑текст</label>
              <input className="w-full border rounded px-3 py-2 bg-transparent" value={coverAlt} onChange={(e)=>setCoverAlt(e.target.value)} placeholder="Описание изображения (обязательно для SEO)" />
            </div>
            <div>
              <label className="block text-sm mb-1">Подпись (caption)</label>
              <input className="w-full border rounded px-3 py-2 bg-transparent" value={coverCaption} onChange={(e)=>setCoverCaption(e.target.value)} placeholder="Необязательно" />
            </div>
          </div>
          {uploading && <div className="text-xs text-gray-500">Загрузка…</div>}
          {uploadError && <div className="text-xs text-red-500">{uploadError}</div>}
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


