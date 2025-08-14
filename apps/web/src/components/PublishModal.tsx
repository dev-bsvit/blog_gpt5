"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { getIdToken } from "firebase/auth";

export type CoverInfo = {
  url: string;
  width?: number;
  height?: number;
  alt: string;
  caption?: string;
  focal?: { x: number; y: number } | null;
};

export default function PublishModal({
  open,
  onClose,
  onPublish,
  onSaveDraft,
  initialAlt,
}: {
  open: boolean;
  onClose: () => void;
  onPublish: (data: { cover: CoverInfo; tags: string[] }) => Promise<void> | void;
  onSaveDraft: (data: { cover?: CoverInfo | null; tags: string[] }) => Promise<void> | void;
  initialAlt?: string;
}) {
  // const [file, setFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [alt, setAlt] = useState<string>(initialAlt || "");
  const [caption, setCaption] = useState<string>("");
  const [focal, setFocal] = useState<{ x: number; y: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const tagOptions = ["технологии", "дизайн", "бизнес", "front", "ai"];

  useEffect(() => {
    if (!open) {
      setErr("");
    }
  }, [open]);

  if (!open) return null;

  async function uploadSelected(f: File) {
    if (!f) return;
    if (!/(jpe?g|png|webp)$/i.test(f.type)) {
      setErr("Поддерживаются JPG/PNG/WebP");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErr("Файл больше 10 МБ");
      return;
    }
    setUploading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
      const fd = new FormData();
      fd.append("file", f);
      fd.append("alt", alt || "cover");
      let headers: Record<string, string> | undefined = undefined;
      try {
        const auth = getFirebaseAuth();
        const u = auth.currentUser;
        if (u) {
          const t = await getIdToken(u, true);
          headers = { Authorization: `Bearer ${t}` };
          fd.append("user_id", u.uid);
        }
      } catch {}
      const r = await fetch(`/api/upload/cover`, { method: "POST", body: fd, headers });
      if (!r.ok) throw new Error(`upload ${r.status}`);
      const j = await r.json();
      setCoverUrl(String(j.url || ""));
      setErr("");
    } catch (e) {
      setErr("Ошибка загрузки обложки");
    } finally {
      setUploading(false);
    }
  }

  function onPickTag(v: string) {
    setTags((prev) => (prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v].slice(0, 3)));
  }

  function handleClickPreview(e: React.MouseEvent<HTMLDivElement>) {
    const box = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    setFocal({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
  }

  async function doPublish(isDraft: boolean) {
    if (!isDraft && (!coverUrl || alt.trim().length < 10)) {
      setErr("Нужна обложка и alt 10–140 символов");
      return;
    }
    const payload = { cover: coverUrl ? { url: coverUrl, alt, caption, focal } : null, tags };
    if (isDraft) await onSaveDraft(payload);
    else await onPublish(payload as { cover: CoverInfo; tags: string[] });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-4xl rounded-xl bg-zinc-900 p-4 shadow-xl border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Настройки публикации</h3>
          <button className="px-2 py-1 rounded bg-zinc-700" onClick={onClose}>✕</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="aspect-[16/9] relative rounded-lg overflow-hidden border border-white/10" onClick={handleClickPreview}>
              {coverUrl ? (
                <Image src={coverUrl} alt={alt || "cover"} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">Перетащите файл или нажмите ниже</div>
              )}
              {focal && (
                <div className="absolute" style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%`, transform: "translate(-50%,-50%)" }}>
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">Рекомендованный размер — 1280×720</div>
            <div className="mt-2 flex gap-2">
              <label className="px-3 py-1 rounded bg-zinc-700 text-white cursor-pointer">
                + Загрузить<input className="hidden" type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if (f) { uploadSelected(f);} }} />
              </label>
              {uploading && <div className="text-xs text-gray-400">Загрузка…</div>}
            </div>
          </div>
          <div>
            <div className="space-y-2">
              <div>
                <label className="block text-sm mb-1">Alt (обязательно)</label>
                <input className="w-full px-3 py-2 rounded bg-transparent border" maxLength={140} value={alt} onChange={(e)=>setAlt(e.target.value)} placeholder="Описание изображения" />
              </div>
              <div>
                <label className="block text-sm mb-1">Подпись (необязательно)</label>
                <input className="w-full px-3 py-2 rounded bg-transparent border" value={caption} onChange={(e)=>setCaption(e.target.value)} placeholder="Например: Фото автора" />
              </div>
              <div>
                <label className="block text-sm mb-1">Теги (1–3)</label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((t)=>(
                    <button key={t} type="button" onClick={()=>onPickTag(t)} className={`px-2 py-1 rounded border ${tags.includes(t)?"bg-emerald-600 text-white":"bg-transparent"}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {err && <div className="mt-3 text-sm text-red-400">{err}</div>}
        <div className="mt-4 flex items-center justify-end gap-3">
          <button className="px-4 py-2 rounded bg-zinc-700" onClick={()=>doPublish(true)}>Сохранить как черновик</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={()=>doPublish(false)}>Опубликовать</button>
        </div>
      </div>
    </div>
  );
}


