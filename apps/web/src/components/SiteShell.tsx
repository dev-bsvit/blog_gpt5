"use client";
import { Suspense } from "react";
import HomeTabs from "@/components/HomeTabs";
import NewsList from "@/components/NewsList";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="puk-container p-6">
      <div className="puk-grid">
        <div className="hidden lg:block lg-puk-col-3">
          <div className="sticky top-[88px]">
            <Suspense fallback={null}><HomeTabs /></Suspense>
          </div>
        </div>
        <div className="puk-col-14 lg-puk-col-8">
          {children}
        </div>
        <div className="hidden lg:block lg-puk-col-3">
          <div className="sticky top-[88px]">
            <NewsList />
          </div>
        </div>
      </div>
    </main>
  );
}


