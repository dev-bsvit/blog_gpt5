"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
const TrixEditor = dynamic(() => import("@/components/TrixEditor"), { ssr: false });
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import Image from "next/image";
import PageLoader from "@/components/PageLoader";
import FancyLoader from "@/components/FancyLoader";
import { getIdToken, onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, hasFirebaseEnv } from "@/lib/firebaseClient";

export default function WritePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  // Stage 1
  const [title, setTitle] = useState<string>("");
  const titleRef = useRef<HTMLInputElement | null>(null);
  const [contentHtml, setContentHtml] = useState<string>("");
  const [autoStatus, setAutoStatus] = useState<string>("—");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [draftSlug, setDraftSlug] = useState<string | null>(null);
  // const [serverUpdatedAt, setServerUpdatedAt] = useState<string | null>(null);
  // Stage 2
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverAlt, setCoverAlt] = useState<string>("");
  const [coverCaption, setCoverCaption] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const tagOptions = ["Технологии", "Дизайн", "Бизнес", "AI", "Frontend"]; // можно расширить
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingNow, setSavingNow] = useState(false);
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
    try {
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(auth, (u) => { setAuthorized(Boolean(u)); setCurrentUid(u?.uid || null); });
      return () => unsub();
    } catch { setAuthorized(false); setCurrentUid(null); }
  }, []);

  // Restore draft from localStorage (title/content only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("draft.write");
      if (raw) {
        const j = JSON.parse(raw);
        if (typeof j.title === "string") setTitle(j.title);
        if (typeof j.contentHtml === "string") setContentHtml(j.contentHtml);
        if (typeof j.draftSlug === "string") setDraftSlug(j.draftSlug);
      }
    } catch {}
  }, []);

  // If restored draft belongs to other user, discard it to avoid 403 on PUT
  useEffect(() => {
    (async () => {
      if (!currentUid || !draftSlug) return;
      try {
        const a = await apiGet<any>(`/articles/${draftSlug}`);
        const owner = (a?.created_by || "").trim();
        if (owner && owner !== currentUid) {
          setDraftSlug(null);
          try { localStorage.removeItem("draft.write"); } catch {}
        }
      } catch { /* ignore */ }
    })();
  }, [currentUid, draftSlug]);

  // Before unload confirmation when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "Есть несохранённые изменения";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Validation
  const titleValid = useMemo(() => {
    const t = ((titleRef.current?.value ?? title) || "").trim();
    return t.length >= 3 && t.length <= 120;
  }, [title]);
  const contentHasMeaning = useMemo(() => {
    const text = (contentHtml || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim();
    return text.length >= 1; // хотя бы один непустой символ
  }, [contentHtml]);
  const canNext = titleValid && contentHasMeaning;

  // Autosave (first POST draft, then PUT updates)
  const runAutosave = useCallback(async () => {
    if (!authorized) { setAutoStatus("—"); return; }
    setAutoStatus("Сохраняю…");
    try {
      let slug = draftSlug;
      if (!slug) {
        const created = await apiPost<{ slug: string; updated_at?: string }>("/articles", {
          title: ((titleRef.current?.value ?? title) || "Untitled").trim(),
          subtitle: "",
          content: contentHtml,
          is_published: false,
          tags: [],
          category: tags[0] || "Технологии",
        });
        slug = created.slug;
        setDraftSlug(slug);
        // setServerUpdatedAt(created.updated_at || null);
      } else {
        try {
          const updated = await apiPut<{ updated_at?: string }>(`/articles/${slug}`, {
            title: ((titleRef.current?.value ?? title) || "Untitled").trim(),
            content: contentHtml,
            is_published: false,
          });
          // setServerUpdatedAt((updated as { updated_at?: string }).updated_at || null);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("403")) {
            const created = await apiPost<{ slug: string }>("/articles", {
              title: ((titleRef.current?.value ?? title) || "Untitled").trim(),
              content: contentHtml,
              is_published: false,
              tags: [],
              category: tags[0] || "Технологии",
            });
            slug = created.slug;
            setDraftSlug(slug);
          } else {
            throw e;
          }
        }
      }
      const now = new Date();
      setAutoStatus(`Сохранено в ${now.toLocaleTimeString()}`);
      setDirty(false);
      try { localStorage.setItem("draft.write", JSON.stringify({ title: (titleRef.current?.value ?? title), contentHtml, draftSlug: slug })); } catch {}
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAutoStatus("Ошибка автосохранения");
      setBanner({ type: "error", text: msg || "Не удалось сохранить" });
    }
  }, [authorized, draftSlug, title, contentHtml, tags]);

  async function saveNow() {
    if (!authorized) { router.push("/login"); return; }
    setSavingNow(true);
    setBanner(null);
    try {
      await runAutosave();
      setBanner({ type: "success", text: "Черновик сохранён" });
      setTimeout(() => setBanner(null), 2500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setBanner({ type: "error", text: msg || "Не удалось сохранить" });
    } finally {
      setSavingNow(false);
    }
  }

  useEffect(() => {
    if (!dirty) return;
    if (saveTimerRef.current) return;
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current && clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      runAutosave();
    }, 5000);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [dirty, runAutosave]);

  function toggleTag(t: string) {
    setTags((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 3) return prev; // лимит 3
      return [...prev, t];
    });
  }

  function resetDraft() {
    setDraftSlug(null);
    setTitle("");
    setContentHtml("");
    setCoverUrl("");
    setCoverAlt("");
    setCoverCaption("");
    setTags([]);
    setDirty(false);
    setAutoStatus("—");
    try { localStorage.removeItem("draft.write"); } catch {}
  }

  async function publishArticle() {
    setError("");
    if (!authorized) { router.push("/login"); return; }
    if (!canNext) { setStep(1); return; }
    try {
      // ensure draft saved
      if (dirty) await runAutosave();
      let slug = draftSlug;
      if (!slug) {
        const created = await apiPost<{ slug: string }>("/articles", {
          title: ((titleRef.current?.value ?? title) || "Untitled").trim(),
          content: contentHtml,
          is_published: false,
          tags,
          category: tags[0] || "Технологии",
          cover_url: coverUrl || undefined,
          cover_alt: coverAlt || undefined,
          cover_caption: coverCaption || undefined,
        });
        slug = created.slug;
        setDraftSlug(slug);
      }
      const updated = await apiPut<{ slug: string }>(`/articles/${slug}`, {
        title: ((titleRef.current?.value ?? title) || "Untitled").trim(),
        content: contentHtml,
        is_published: true,
        tags,
        category: tags[0] || "Технологии",
        cover_url: coverUrl || undefined,
        cover_alt: coverAlt || undefined,
        cover_caption: coverCaption || undefined,
      });
      try { localStorage.removeItem("draft.write"); } catch {}
      router.push(`/article/${slug}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Не удалось опубликовать");
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>Тип: Статья</span>
          {draftSlug && (
            <button type="button" className="px-2 py-1 rounded bg-zinc-800" onClick={resetDraft} title="Начать новый черновик">
              Новый черновик
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded bg-zinc-800" onClick={saveNow} disabled={savingNow}>{savingNow?"Сохраняю…":"Сохранить черновик"}</button>
          <button className="px-2 py-1 rounded bg-zinc-800" onClick={()=>setPreviewOpen(true)}>👁 Предпросмотр</button>
          {step === 1 ? (
            <button className={`px-3 py-2 rounded ${canNext?"bg-blue-600 text-white":"bg-zinc-700 text-gray-400"}`} disabled={!canNext} onClick={()=>setStep(2)}>Далее</button>
          ) : (
            <>
              <button className="px-3 py-2 rounded bg-zinc-700" onClick={()=>setStep(1)}>Назад</button>
              <button className={`px-3 py-2 rounded ${canNext?"bg-blue-600 text-white":"bg-zinc-700 text-gray-400"}`} disabled={!canNext} onClick={publishArticle}>Опубликовать</button>
            </>
          )}
        </div>
      </header>

      {banner && (
        <div className={`text-sm rounded px-3 py-2 ${banner.type==="success"?"bg-emerald-700 text-white":"bg-red-700 text-white"}`}>{banner.text}</div>
      )}
      <PageLoader active={savingNow || uploading} />
      <FancyLoader active={savingNow || uploading} duration={800} />

      {step === 1 && (
        <section className="space-y-3">
          <input
            autoFocus
            className="w-full text-3xl font-semibold bg-transparent outline-none border-b border-white/10 pb-2"
            placeholder="Заголовок"
            defaultValue={title}
            ref={titleRef}
            onChange={(e)=>{ setTitle(e.target.value); setDirty(true); setAutoStatus("—"); }}
            aria-invalid={!titleValid}
          />
          {!titleValid && <div className="text-sm text-red-400">Заголовок 3–120 символов</div>}
          <div className="trix-sheet">
            <TrixEditor value={contentHtml} onChange={(html)=>{ setContentHtml(html); setDirty(true); setAutoStatus("—"); }} placeholder="Начните писать…" onError={(m)=> setBanner({ type: "error", text: m })} />
          </div>
          <div className="text-xs text-gray-500">Автосохранение: {autoStatus}</div>
        </section>
      )}

      {step === 2 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Обложка (16:9)</h3>
            {coverUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <div className="relative aspect-[16/9]">
                  <Image src={coverUrl} alt={coverAlt || title || "cover"} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
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
                <div className="text-sm">+ Загрузить (реком. 1280×720)</div>
                <input type="file" className="hidden" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) onCoverChange(f);}} />
              </label>
            )}
            {uploading && <div className="text-xs text-gray-500 mt-1">Загрузка…</div>}
            {uploadError && <div className="text-xs text-red-500 mt-1">{uploadError}</div>}
            <div className="grid grid-cols-1 gap-2 mt-2">
              <input className="w-full border rounded px-3 py-2 bg-transparent" value={coverAlt} onChange={(e)=>setCoverAlt(e.target.value)} placeholder="Alt‑текст (обязательно)" />
              <input className="w-full border rounded px-3 py-2 bg-transparent" value={coverCaption} onChange={(e)=>setCoverCaption(e.target.value)} placeholder="Подпись (необязательно)" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Теги (до 3)</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {tagOptions.map((t)=> (
                <button key={t} type="button" className={`px-2 py-1 rounded border ${tags.includes(t)?"bg-emerald-600 text-white":"bg-transparent"}`} onClick={()=>toggleTag(t)} aria-pressed={tags.includes(t)}>
                  {t}
                </button>
              ))}
            </div>
            {tags.length>3 && <div className="text-xs text-red-400">Можно выбрать до 3 тегов</div>}
            <div className="mt-4 text-sm text-gray-400">Предпросмотр</div>
            <div className="rounded-xl border border-white/10 p-3 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml || "<div>Нет содержимого</div>" }} />
            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
          </div>
        </section>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={()=>setPreviewOpen(false)}>
          <div className="w-full max-w-3xl rounded-xl bg-zinc-900 p-4 shadow-xl border border-white/10" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Предпросмотр</h3>
              <button className="px-2 py-1 rounded bg-zinc-700" onClick={()=>setPreviewOpen(false)}>✕</button>
            </div>
            {coverUrl && (
              <figure className="relative mb-3 overflow-hidden rounded-xl aspect-[16/9]">
                <Image src={coverUrl} alt={coverAlt || title || "cover"} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
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



