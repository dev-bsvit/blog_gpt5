"use client";
import { useEffect, useMemo, useRef } from "react";
import EditorJSMenu, { type BlockAction } from "./EditorJSMenu";
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
  type BlocksApi = {
    insert: (type: string, data?: unknown, config?: unknown, index?: number) => void;
    getBlocksCount: () => number;
  };
  type CaretApi = { setToLastBlock?: () => void };
  type EditorInstance = { isReady?: Promise<void>; destroy?: () => void; blocks?: BlocksApi; caret?: CaretApi } | null;
  const ref = useRef<EditorInstance>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ default: EditorJSClass }, { default: Header }, { default: List }, { default: Quote }, { default: Checklist }] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/list"),
        import("@editorjs/quote"),
        import("@editorjs/checklist"),
      ]);

      if (!mounted) return;
      // Minimal local types to satisfy TS
      type ToolConstructable = new (...args: unknown[]) => unknown;
      type EditorConfig = {
        holder: string;
        placeholder?: string;
        autofocus?: boolean;
        tools?: Record<string, unknown>;
        data?: EditorJSData | { blocks: unknown[] };
        onChange?: (api: { saver: { save: () => Promise<EditorJSData> } }) => void;
      };

      const options: EditorConfig = {
      holder: holderId,
      placeholder: placeholder || "Начните писать...",
      autofocus: true,
        tools: {
          header: { class: Header as unknown as ToolConstructable, inlineToolbar: true, config: { levels: [2, 3], defaultLevel: 2 } },
          list: { class: List as unknown as ToolConstructable, inlineToolbar: true },
          quote: { class: Quote as unknown as ToolConstructable, inlineToolbar: true },
          checklist: { class: Checklist as unknown as ToolConstructable, inlineToolbar: true },
        } as Record<string, unknown>,
      data: value || { blocks: [] },
        async onChange(api: { saver: { save: () => Promise<EditorJSData> } }) {
          const data = await api.saver.save();
          onChange(data);
      },
      };
      // Cast constructor target to a compatible signature to satisfy TS without any
      const EditorCtor = EditorJSClass as unknown as { new (cfg: EditorConfig): { isReady?: Promise<void>; destroy?: () => void } };
      const editor = new EditorCtor(options);
      ref.current = editor as unknown as EditorInstance;
    })();

    return () => {
      mounted = false;
      const ed = ref.current;
      if (ed && typeof ed === "object") {
        try {
          ed.isReady?.then(() => ed.destroy && ed.destroy()).catch(() => {});
        } catch {}
      }
    };
  }, [holderId, onChange, placeholder, value]);

  return (
    <div className="border rounded-xl bg-transparent">
      <div className="flex items-center gap-2 p-2 border-b border-white/10">
        <EditorJSMenu onPick={(a: BlockAction) => {
          const ed = ref.current as EditorInstance;
          if (!ed || !ed.blocks) return;
          const idx = ed.blocks.getBlocksCount();
          switch (a.type) {
            case "paragraph": ed.blocks.insert("paragraph", undefined, undefined, idx); break;
            case "header": ed.blocks.insert("header", { level: a.level }, undefined, idx); break;
            case "list": ed.blocks.insert("list", { style: a.style }, undefined, idx); break;
            case "checklist": ed.blocks.insert("checklist", undefined, undefined, idx); break;
            case "quote": ed.blocks.insert("quote", undefined, undefined, idx); break;
          }
          ed.caret?.setToLastBlock?.();
        }} />
      </div>
      <div id={holderId} className="prose prose-invert max-w-none p-3" />
    </div>
  );
}


