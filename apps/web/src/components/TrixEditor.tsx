"use client";
import { useEffect, useRef } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { getIdToken } from "firebase/auth";

type Props = {
  value?: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function TrixEditor({ value, onChange, placeholder }: Props) {
  const inputIdRef = useRef<string>(`trix-${Math.random().toString(36).slice(2)}`);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = editorRef.current as HTMLElement | null;
    if (!el) return;

    function handleChange() {
      const v = inputRef.current?.value ?? "";
      onChange(v);
    }

    async function handleAttachmentAdd(e: Event) {
      const ev = e as unknown as { attachment?: { file?: File; setAttributes?: (attrs: Record<string, string>) => void } };
      const att = ev?.attachment;
      const file: File | undefined = att?.file;
      if (!file) return;
      try {
        const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("alt", file.name || "image");
        let headers: Record<string, string> | undefined = undefined;
        try {
          const auth = getFirebaseAuth();
          const user = auth.currentUser;
          if (user) {
            const token = await getIdToken(user, true);
            headers = { Authorization: `Bearer ${token}` };
            fd.append("user_id", user.uid);
          }
        } catch {}
        const r = await fetch(`${base}/upload/cover`, { method: "POST", body: fd, headers });
        if (!r.ok) throw new Error("upload failed");
        const j = await r.json();
        // Trix typings отсутствуют в проекте
        (att as unknown as { setAttributes?: (a: Record<string,string>)=>void })?.setAttributes?.({ url: j.url, href: j.url });
      } catch {
        // swallow
      }
    }

    el.addEventListener("trix-change", handleChange as EventListener);
    el.addEventListener("trix-attachment-add", handleAttachmentAdd as EventListener);
    return () => {
      el.removeEventListener("trix-change", handleChange as EventListener);
      el.removeEventListener("trix-attachment-add", handleAttachmentAdd as EventListener);
    };
  }, [onChange]);

  useEffect(() => {
    // Keep input value in sync from props
    if (typeof value === "string" && inputRef.current) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <div className="border rounded-xl bg-transparent">
      <input id={inputIdRef.current} type="hidden" ref={inputRef} defaultValue={value || ""} />
      {/* @ts-expect-error trix custom element */}
      <trix-editor
        ref={editorRef}
        input={inputIdRef.current}
        class={"prose prose-invert max-w-none p-3"}
        placeholder={placeholder || "Начните писать…"}
      />
    </div>
  );
}


