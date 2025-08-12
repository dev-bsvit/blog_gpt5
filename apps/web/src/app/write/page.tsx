"use client";
import { useEffect, useState } from "react";
// import RichEditor from "@/components/RichEditor";
import EditorJS, { EditorJSData } from "@/components/EditorJS";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import Image from "next/image";
import { getIdToken, onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, hasFirebaseEnv } from "@/lib/firebaseClient";

export default function WritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState<string>("");
  const [contentJson, setContentJson] = useState<EditorJSData>({ blocks: [] });
  const [category, setCategory] = useState<string>("Технологии");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [readingMinutes, setReadingMinutes] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverAlt, setCoverAlt] = useState<string>("");
  const [coverCaption, setCoverCaption] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [publishNow, setPublishNow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);
  async function onCoverChange(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("alt", coverAlt || (title || "cover"));
    setUploading(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
      // Bearer token + uid fallback for backend
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
        content: content || JSON.stringify(contentJson),
        is_published: publishNow,
        category,
        tags: tagsInput.split(',').map(s=>s.trim()).filter(Boolean),
        reading_time_minutes: readingMinutes.trim() ? Number(readingMinutes.trim()) : undefined,
        cover_url: coverUrl || undefined,
        cover_alt: coverAlt || undefined,
        cover_caption: coverCaption || undefined,
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
          <label className="block text-sm mb-1">Текст (Editor.js)</label>
          <EditorJS value={contentJson} onChange={setContentJson} placeholder="Черновик..." />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Обложка</h3>
          {coverUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <div className="relative aspect-[16/9]">
                <Image src={coverUrl} alt={coverAlt || title || "cover"} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
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



