"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import PublishModal from "@/components/PublishModal";
import { getFirebaseAuth, hasFirebaseEnv } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

const Editor = dynamic(() => import("@/components/EditorJS"), { ssr: false });

type EditorData = { time?: number; blocks: Array<{ type: string; data: Record<string, unknown> }>; version?: string };

export default function Write2() {
  const [authorized, setAuthorized] = useState(false);
  const [title, setTitle] = useState("");
  const [data, setData] = useState<EditorData>({ blocks: [] });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openPublish, setOpenPublish] = useState(false);
  const key = useMemo(()=>"draft.write2",[]);

  useEffect(() => {
    if (!hasFirebaseEnv()) return;
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u)=> setAuthorized(Boolean(u)));
    return () => unsub();
  }, []);

  // restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const j = JSON.parse(raw);
        setTitle(j.title || "");
        setData(j.data || { blocks: [] });
      }
    } catch {}
  }, [key]);

  // autosave
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ title, data }));
      } catch {}
      setDirty(false);
    }, 5000);
    return () => clearTimeout(t);
  }, [dirty, title, data, key]);

  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "Есть несохранённые изменения";
      }
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  function isValidTitle(t: string) {
    const s = (t || "").trim();
    return s.length >= 10 && s.length <= 120;
  }
  function contentStats(d: EditorData) {
    const text = d.blocks.map(b => String(Object.values(b.data || {}).join(" "))).join(" ");
    const chars = text.replace(/\s+/g, " ").trim().length;
    const blocks = d.blocks.filter(b => ["paragraph","header","list","quote"].includes(b.type)).length;
    return { chars, blocks };
  }
  const canNext = isValidTitle(title) && (()=>{const s = contentStats(data); return (s.blocks>=1) && (s.chars>=600 || s.blocks>=3);})();

  if (!authorized) return <main className="p-6">Требуется вход</main>;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <button className="px-2 py-1 rounded bg-zinc-800" onClick={()=>history.back()}>Назад</button>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded bg-zinc-800" onClick={()=>setOpenPublish(true)} disabled={!canNext}>Далее</button>
        </div>
      </div>
      <input
        className="w-full text-3xl font-semibold bg-transparent outline-none border-b border-white/10 pb-2"
        placeholder="Заголовок"
        value={title}
        onChange={(e)=>{setTitle(e.target.value); setDirty(true);}}
      />
      <div className="text-sm text-gray-500">{isValidTitle(title)?"":"Заголовок 10–120 символов"}</div>
      <section className="rounded-xl border border-white/10">
        <Editor value={data} onChange={(d)=>{ setData(d as EditorData); setDirty(true); }} placeholder="Начните свой рассказ…" />
      </section>
      <PublishModal
        open={openPublish}
        onClose={()=>setOpenPublish(false)}
        onPublish={async ()=>{ setOpenPublish(false); alert("Пока заглушка публикации"); }}
        onSaveDraft={async ()=>{ setOpenPublish(false); alert("Сохранено как черновик"); }}
        initialAlt={title}
      />
    </main>
  );
}


