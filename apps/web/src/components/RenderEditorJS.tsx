import React from "react";
import type { EditorJSData } from "./EditorJS";

// Simple renderer for a subset of Editor.js blocks
export default function RenderEditorJS({ data }: { data: EditorJSData }) {
  if (!data || !Array.isArray(data.blocks)) return null;
  return (
    <div className="prose prose-invert max-w-none">
      {data.blocks.map((b, idx) => {
        if (b.type === "paragraph") {
          return <p key={idx} dangerouslySetInnerHTML={{ __html: String((b.data as any).text || "") }} />;
        }
        if (b.type === "header") {
          const level = Number((b.data as any).level || 2);
          const text = String((b.data as any).text || "");
          const Tag = (`h${Math.min(Math.max(level,2),3)}` as keyof JSX.IntrinsicElements);
          return <Tag key={idx} dangerouslySetInnerHTML={{ __html: text }} />;
        }
        if (b.type === "list") {
          const style = String((b.data as any).type || "unordered");
          const items = Array.isArray((b.data as any).items) ? (b.data as any).items : [];
          return style === "ordered" ? (
            <ol key={idx}>{items.map((it: string, i: number) => <li key={i} dangerouslySetInnerHTML={{ __html: it }} />)}</ol>
          ) : (
            <ul key={idx}>{items.map((it: string, i: number) => <li key={i} dangerouslySetInnerHTML={{ __html: it }} />)}</ul>
          );
        }
        if (b.type === "quote") {
          const text = String((b.data as any).text || "");
          const cap = String((b.data as any).caption || "");
          return <blockquote key={idx}><div dangerouslySetInnerHTML={{ __html: text }} />{cap && <cite>{cap}</cite>}</blockquote>;
        }
        return null;
      })}
    </div>
  );
}


