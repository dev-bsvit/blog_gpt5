"use client";
import { useState } from "react";

export type BlockAction =
  | { type: "paragraph" }
  | { type: "header"; level: 1 | 2 | 3 }
  | { type: "list"; style: "ordered" | "unordered" }
  | { type: "quote" }
  | { type: "checklist" };

export default function EditorJSMenu({ onPick }: { onPick: (action: BlockAction) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="px-2 py-1 rounded bg-zinc-700 text-white" onClick={()=>setOpen(v=>!v)}>+</button>
      {open && (
        <div className="absolute z-10 mt-2 w-64 rounded border border-white/10 bg-zinc-900 p-2 shadow-lg">
          <input className="w-full mb-2 px-2 py-1 rounded bg-zinc-800" placeholder="Filter" />
          <ul className="space-y-1 text-sm">
            <li><button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800" onClick={()=>{onPick({type:"paragraph"}); setOpen(false);}}>Text</button></li>
            <li><button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800" onClick={()=>{onPick({type:"header", level:1}); setOpen(false);}}>Heading 1</button></li>
            <li><button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800" onClick={()=>{onPick({type:"header", level:2}); setOpen(false);}}>Heading 2</button></li>
            <li><button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800" onClick={()=>{onPick({type:"header", level:3}); setOpen(false);}}>Heading 3</button></li>
            <li><button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800" onClick={()=>{onPick({type:"list", style:"ordered"}); setOpen(false);}}>Numbered List</button></li>
            <li><button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800" onClick={()=>{onPick({type:"list", style:"unordered"}); setOpen(false);}}>Bulleted List</button></li>
            <li><button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800" onClick={()=>{onPick({type:"checklist"}); setOpen(false);}}>Checklist</button></li>
            <li><button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800" onClick={()=>{onPick({type:"quote"}); setOpen(false);}}>Quote</button></li>
          </ul>
        </div>
      )}
    </div>
  );
}


