import React from "react";
import type { EditorJSData } from "./EditorJS";

type ParagraphData = { text?: string };
type HeaderData = { text?: string; level?: number };
type ListData = { type?: "unordered" | "ordered"; items?: string[] };
type QuoteData = { text?: string; caption?: string };

type Block =
  | { id?: string; type: "paragraph"; data: ParagraphData }
  | { id?: string; type: "header"; data: HeaderData }
  | { id?: string; type: "list"; data: ListData }
  | { id?: string; type: "quote"; data: QuoteData }
  | { id?: string; type: string; data: unknown };

// Simple renderer for a subset of Editor.js blocks
export default function RenderEditorJS({ data }: { data: EditorJSData }) {
  if (!data || !Array.isArray(data.blocks)) return null;
  const blocks = data.blocks as Block[];
  return (
    <div className="prose prose-invert max-w-none">
      {blocks.map((b, idx) => {
        if (b.type === "paragraph") {
          const text = (b.data as ParagraphData).text ?? "";
          return <p key={idx} dangerouslySetInnerHTML={{ __html: String(text) }} />;
        }
        if (b.type === "header") {
          const d = b.data as HeaderData;
          const level = Math.min(Math.max(Number(d.level ?? 2), 2), 3);
          const Tag = (`h${level}` as keyof JSX.IntrinsicElements);
          const text = String(d.text ?? "");
          return <Tag key={idx} dangerouslySetInnerHTML={{ __html: text }} />;
        }
        if (b.type === "list") {
          const d = b.data as ListData;
          const style: "unordered" | "ordered" = d.type === "ordered" ? "ordered" : "unordered";
          const items: string[] = Array.isArray(d.items) ? d.items : [];
          return style === "ordered" ? (
            <ol key={idx}>{items.map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: it }} />)}</ol>
          ) : (
            <ul key={idx}>{items.map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: it }} />)}</ul>
          );
        }
        if (b.type === "quote") {
          const d = b.data as QuoteData;
          const text = String(d.text ?? "");
          const cap = d.caption ? String(d.caption) : "";
          return <blockquote key={idx}><div dangerouslySetInnerHTML={{ __html: text }} />{cap && <cite>{cap}</cite>}</blockquote>;
        }
        return null;
      })}
    </div>
  );
}


