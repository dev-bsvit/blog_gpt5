"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiDelete, apiGet, apiPut } from "@/lib/api";
import Image from "next/image";
import { getFirebaseAuth, hasFirebaseEnv } from "@/lib/firebaseClient";
import { getIdToken, onAuthStateChanged } from "firebase/auth";
import dynamic from "next/dynamic";
const TrixEditor = dynamic(() => import("@/components/TrixEditor"), { ssr: false });

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
  created_by?: string;
};

export default function EditArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [category, setCategory] = useState<string>("Технологии");
  const [tags, setTags] = useState<string[]>([]);
  const tagOptions = ["Технологии", "Дизайн", "Бизнес", "AI", "Frontend"];
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverAlt, setCoverAlt] = useState<string>("");
  const [coverCaption, setCoverCaption] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [ownerUid, setOwnerUid] = useState<string | null>(null);

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
      setCurrentUid(user.uid);
      try {
        const a = await apiGet<Article>(`/articles/${slug}`);
        setTitle(a.title || "");
        setSubtitle(a.subtitle || "");
        setContentHtml(a.content || "");
        setIsPublished(a.is_published !== false);
        setCategory(a.category || "Технологии");
        setTags(Array.isArray(a.tags) ? a.tags : []);
        setCoverUrl(a.cover_url || "");
        setCoverAlt(a.cover_alt || "");
        setCoverCaption(a.cover_caption || "");
        setOwnerUid(a.created_by || null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg || "Не удалось загрузить статью");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router, slug]);

  const canEdit = Boolean(currentUid && ownerUid && currentUid === ownerUid);

  async function onSave() {
    setSaving(true);
    setError("");
    try {
      if (!canEdit) {
        setBanner({ type: "error", text: "Нет прав на редактирование" });
        return;
      }
      const updated = await apiPut<Article>(`/articles/${slug}`, {
        title: (titleRef.current?.value || title || "Untitled").trim(),
        subtitle: subtitle.trim(),
        content: contentHtml,
        is_published: isPublished,
        category,
        tags,
        cover_url: coverUrl || undefined,
        cover_alt: coverAlt || undefined,
        cover_caption: coverCaption || undefined,
      });
      setBanner({ type: "success", text: "Изменения сохранены" });
      setTimeout(() => setBanner(null), 2000);
      if (updated.is_published !== false) router.push(`/article/${slug}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Ошибка сохранения");
      setBanner({ type: "error", text: msg || "Ошибка сохранения" });
    } finally {
      setSaving(false);
    }
  }

  async function onCoverChange(file: File) {
    if (!canEdit) { setBanner({ type: "error", text: "Нет прав на изменение обложки" }); return; }
    const form = new FormData();
    form.append("file", file);
    // alt 10-140
    const baseAlt = (coverAlt || title || slug || "").toString();
    const safeAlt = baseAlt.length < 10 ? `${baseAlt} — обложка` : baseAlt.slice(0, 140);
    form.append("alt", safeAlt);
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
      if (!res.ok) {
        let msg = `upload ${res.status}`;
        try { const j = await res.json(); msg = (j?.detail?.error || msg); } catch {}
        throw new Error(msg);
      }
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
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-secondary">
          <span>Редактировать</span>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublished} onChange={(e)=>setIsPublished(e.target.checked)} />
            Публикована
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded btn-primary disabled:opacity-50" onClick={onSave} disabled={saving || !canEdit}>{saving?"Сохраняю…":"Сохранить"}</button>
          <button className="px-3 py-2 rounded bg-alert text-inv disabled:opacity-50" onClick={onDelete} disabled={deleting || !canEdit}>{deleting?"Удаляю…":"Удалить"}</button>
          <button className="px-2 py-1 rounded btn-secondary" onClick={()=>setPreviewOpen(true)}>👁 Предпросмотр</button>
          {step===1 ? (
            <button className="px-3 py-2 rounded btn-secondary" onClick={()=>setStep(2)}>Далее</button>
          ) : (
            <button className="px-3 py-2 rounded btn-secondary" onClick={()=>setStep(1)}>Назад</button>
          )}
        </div>
      </header>

      {banner && (
        <div className={`text-sm rounded px-3 py-2 ${banner.type==="success"?"bg-success text-inv":"bg-alert text-inv"}`}>{banner.text}</div>
      )}

      {step===1 && (
        <section className="space-y-3">
          <input className="w-full text-3xl font-semibold bg-transparent outline-none border-b border-divider pb-2" placeholder="Заголовок" defaultValue={title} ref={titleRef} onChange={(e)=>setTitle(e.target.value)} readOnly={!canEdit} />
          <input className="w-full bg-transparent outline-none border-b border-divider pb-2" placeholder="Подзаголовок" value={subtitle} onChange={(e)=>setSubtitle(e.target.value)} readOnly={!canEdit} />
          <div className="trix-sheet">
            <TrixEditor value={contentHtml} onChange={setContentHtml} onError={(m)=> setBanner({ type: "error", text: m })} />
          </div>
        </section>
      )}

      {step===2 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Обложка (16:9)</h3>
            {coverUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-divider">
                <div className="relative aspect-[16/9]">
                  <Image src={coverUrl} alt={coverAlt || title || slug} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                </div>
                <div className="p-2 flex gap-2">
                  <button type="button" className="px-3 py-1 rounded btn-secondary" onClick={()=>{setCoverUrl("")}}>Удалить</button>
                  <label className="px-3 py-1 rounded btn-secondary cursor-pointer">
                    Заменить<input type="file" className="hidden" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) onCoverChange(f);}} />
                  </label>
                </div>
              </div>
            ) : (
              <label className="block border border-dashed border-divider rounded-xl p-6 text-center cursor-pointer">
                <div className="text-sm">+ Загрузить (реком. 1280×720)</div>
                <input type="file" className="hidden" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) onCoverChange(f);}} />
              </label>
            )}
            {uploading && <div className="text-xs text-secondary mt-1">Загрузка…</div>}
            {uploadError && <div className="text-xs" style={{ color: "var(--textStatusAlert)" }}>{uploadError}</div>}
            <div className="grid grid-cols-1 gap-2 mt-2">
              <input className="w-full border border-divider rounded px-3 py-2 bg-transparent" value={coverAlt} onChange={(e)=>setCoverAlt(e.target.value)} placeholder="Alt‑текст (обязательно)" readOnly={!canEdit} />
              <input className="w-full border border-divider rounded px-3 py-2 bg-transparent" value={coverCaption} onChange={(e)=>setCoverCaption(e.target.value)} placeholder="Подпись (необязательно)" readOnly={!canEdit} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Теги (до 3)</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {tagOptions.map((t)=> (
                <button key={t} type="button" className={`px-2 py-1 rounded border border-divider ${tags.includes(t)?"bg-success text-inv":"bg-transparent"}`} onClick={()=> canEdit && setTags(prev => prev.includes(t)? prev.filter(x=>x!==t) : (prev.length<3? [...prev, t]: prev))} aria-pressed={tags.includes(t)} disabled={!canEdit}>
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm text-secondary">Предпросмотр</div>
            <div className="rounded-xl border border-divider p-3 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml || "<div>Нет содержимого</div>" }} />
            {error && <div className="text-sm" style={{ color: "var(--textStatusAlert)" }}>{error}</div>}
          </div>
        </section>
      )}

      {/* Removed circular blur loader; top progress bar and inline states remain */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={()=>setPreviewOpen(false)}>
          <div className="w-full max-w-3xl rounded-xl bg-block p-4 shadow-2 border border-divider" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Предпросмотр</h3>
              <button className="px-2 py-1 rounded btn-secondary" onClick={()=>setPreviewOpen(false)}>✕</button>
            </div>
            {coverUrl && (
              <figure className="relative mb-3 overflow-hidden rounded-xl aspect-[16/9]">
                <Image src={coverUrl} alt={coverAlt || title || slug} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              </figure>
            )}
            <h1 className="text-2xl font-semibold mb-2">{title || "Без названия"}</h1>
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml || "<div>Нет содержимого</div>" }} />
          </div>
        </div>
      )}
    </main>
  );
}


