"use client";
import { useEffect, useMemo, useRef } from "react";

// Editor.js dynamically imported to avoid SSR issues
import EditorJSClass, { type ToolConstructable } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
// Note: image tool requires backend uploader, we keep disabled for now or use simple base64

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
  const ref = useRef<EditorJSClass | null>(null);

  useEffect(() => {
    const editor = new EditorJSClass({
      holder: holderId,
      placeholder: placeholder || "Начните писать...",
      autofocus: true,
      tools: {
        header: { class: Header as unknown as ToolConstructable, inlineToolbar: true, config: { levels: [2,3], defaultLevel: 2 } },
        list: { class: List as unknown as ToolConstructable, inlineToolbar: true },
        quote: { class: Quote as unknown as ToolConstructable, inlineToolbar: true },
      } as EditorJSClass["configuration"]["tools"],
      data: value || { blocks: [] },
      async onChange(api) {
        const data = await api.saver.save();
        onChange(data as EditorJSData);
      },
    });
    ref.current = editor;
    return () => { editor.isReady.then(()=>editor.destroy()).catch(()=>{}); };
  }, [holderId, onChange, placeholder, value]);

  return (
    <div className="border rounded-xl bg-transparent">
      <div id={holderId} className="prose prose-invert max-w-none p-3" />
    </div>
  );
}


