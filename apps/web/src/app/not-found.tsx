import Link from "next/link";
import { Suspense } from "react";
import TopProgressBar from "@/components/TopProgressBar";

export default function NotFound() {
  return (
    <main className="puk-container p-6 space-y-4">
      <Suspense fallback={null}><TopProgressBar /></Suspense>
      <h1 className="ty-h2">Страница не найдена</h1>
      <p className="ty-body">Перейти на <Link className="underline" href="/">главную</Link>.</p>
    </main>
  );
}


