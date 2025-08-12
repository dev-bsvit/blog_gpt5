"use client";
import { useEffect, useMemo, useRef } from "react";
// Note: all Editor.js deps are imported lazily in the effect to avoid SSR/prerender crashes

export type EditorJSData = {
  time?: number;
  blocks: Array<{ id?: string; type: string; data: Record<string, unknown> }>;
  version?: string;
};

export default function EditorJS({ value, onChange, placeholder }: {
  value?: EditorJSData | undefined;
  onChange: (data: EditorJSData) => void;
  placeholder?: string;
}) {
  const holderId = useMemo(() => `ej-${Math.random().toString(36).slice(2)}`, []);
  const ref = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ default: EditorJSClass }, { default: Header }, { default: List }, { default: Quote }] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/list"),
        import("@editorjs/quote"),
      ]);

      if (!mounted) return;
      const editor = new EditorJSClass({
      holder: holderId,
      placeholder: placeholder || "Начните писать...",
      autofocus: true,
        tools: {
          header: { class: Header as any, inlineToolbar: true, config: { levels: [2, 3], defaultLevel: 2 } },
          list: { class: List as any, inlineToolbar: true },
          quote: { class: Quote as any, inlineToolbar: true },
        },
      data: value || { blocks: [] },
      async onChange(api) {
        const data = await api.saver.save();
        onChange(data as EditorJSData);
      },
      });
      ref.current = editor;
    })();

    return () => {
      mounted = false;
      const ed: any = ref.current;
      if (ed) {
        try {
          ed.isReady?.then(() => ed.destroy()).catch(() => {});
        } catch {}
      }
    };
  }, [holderId, onChange, placeholder, value]);

  return (
    <div className="border rounded-xl bg-transparent">
      <div id={holderId} className="prose prose-invert max-w-none p-3" />
    </div>
  );
}


