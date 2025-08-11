"use client";
import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { AnyExtension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";

type Props = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
};

export default function RichEditor({ value, onChange, placeholder }: Props) {
  const lastOutboundMarkdownRef = useRef<string>("");
  const editor = useEditor({
    extensions: [
      // Use StarterKit minus nodes we override explicitly
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
      }),
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      Link.configure({ openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: placeholder || "Начните писать..." }),
      // Tip: types for tiptap-markdown are loose; coerce to AnyExtension
      (Markdown.configure({ html: false }) as unknown as AnyExtension),
    ],
    content: value || "",
    onUpdate({ editor }) {
      // tiptap-markdown writes to editor.storage.markdown
      const md = (editor as unknown as { storage?: { markdown?: { getMarkdown?: () => string } } })
        ?.storage?.markdown?.getMarkdown?.();
      if (typeof md === "string") {
        onChange(md);
        lastOutboundMarkdownRef.current = md;
      } else {
        const text = editor.getText();
        onChange(text);
        lastOutboundMarkdownRef.current = text;
      }
    },
  });

  // Sync external value into editor when it changes significantly
  useEffect(() => {
    if (!editor) return;
    // Avoid feedback loop: only apply prop value if it differs from last outbound change
    if ((value || "") !== (lastOutboundMarkdownRef.current || "")) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  function addLink() {
    const url = window.prompt("Вставьте ссылку (https://...)", "https://");
    if (!url) return;
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function addImage() {
    const url = window.prompt("URL изображения", "https://");
    if (!url) return;
    editor?.chain().focus().setImage({ src: url }).run();
  }

  return (
    <div className="border rounded-lg bg-transparent">
      <div className="flex flex-wrap gap-2 p-2 border-b text-sm">
        <button
          type="button"
          className="px-2 py-1 rounded bg-zinc-700 text-white"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        >Ж</button>
        <button
          type="button"
          className="px-2 py-1 rounded bg-zinc-700 text-white"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        >К</button>
        <span className="mx-1 w-px bg-zinc-700" />
        <button
          type="button"
          className="px-2 py-1 rounded bg-zinc-700 text-white"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
        >H2</button>
        <button
          type="button"
          className="px-2 py-1 rounded bg-zinc-700 text-white"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
        >H3</button>
        <span className="mx-1 w-px bg-zinc-700" />
        <button
          type="button"
          className="px-2 py-1 rounded bg-zinc-700 text-white"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        >• Список</button>
        <button
          type="button"
          className="px-2 py-1 rounded bg-zinc-700 text-white"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
        >1. Список</button>
        <button
          type="button"
          className="px-2 py-1 rounded bg-zinc-700 text-white"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }}
        >Цитата</button>
        <span className="mx-1 w-px bg-zinc-700" />
        <button
          type="button"
          className="px-2 py-1 rounded bg-teal-700 text-white"
          onMouseDown={(e) => { e.preventDefault(); addLink(); }}
        >Ссылка</button>
        <button
          type="button"
          className="px-2 py-1 rounded bg-teal-700 text-white"
          onMouseDown={(e) => { e.preventDefault(); addImage(); }}
        >Изображение</button>
      </div>
      <div className="min-h-64 p-3">
        <EditorContent editor={editor} className="tiptap" />
      </div>
    </div>
  );
}


