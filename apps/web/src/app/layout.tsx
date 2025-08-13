import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import SWRProvider from "@/components/SWRProvider";
import WriteGuardLink from "@/components/WriteGuardLink";
import TopProgressBar from "@/components/TopProgressBar";
import HeaderSearch from "@/components/HeaderSearch";
import Footer from "@/components/Footer";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blog MVP",
  description: "SEO‑оптимизированная платформа блогов",
  alternates: {
    types: {
      'application/rss+xml': '/rss.xml',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "").trim();
  let apiOrigin = "";
  try {
    apiOrigin = apiBase ? new URL(apiBase).origin : "";
  } catch {
    apiOrigin = "";
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent FOUC: inline theme setter */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var theme = localStorage.getItem('theme');
              if(!theme){
                var m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
                theme = (m && m.matches) ? 'dark' : 'light';
              }
              if(theme === 'dark') document.documentElement.classList.add('theme-dark');
              else document.documentElement.classList.remove('theme-dark');
            } catch(e){}
          })();
        ` }} />
        {/* Trix editor assets (official build) */}
        <link rel="stylesheet" href="https://unpkg.com/trix@2.1.15/dist/trix.css" />
        <script src="https://unpkg.com/trix@2.1.15/dist/trix.umd.min.js" defer />
        {apiOrigin && (
          <>
            <link rel="preconnect" href={apiOrigin} crossOrigin="" />
            <link rel="dns-prefetch" href={apiOrigin} />
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b border-divider sticky top-0 z-10 backdrop-blur bg-block">
          <div className="max-w-6xl mx-auto grid grid-cols-3 items-center gap-4d pad-4d">
            <div className="flex items-center gap-4d">
              <Link href="/" className="ty-title">Блог</Link>
              <Link href="/rss.xml" className="underline hidden md:inline" title="RSS">RSS</Link>
            </div>
            <div className="flex justify-center">
              <HeaderSearch />
            </div>
            <nav className="flex items-center justify-end gap-3d ty-body">
              <WriteGuardLink />
              <Link href="/write" className="px-3d py-2d rounded-2xl btn-secondary hidden sm:inline">Написать</Link>
              <Link href="/login" className="underline hidden sm:inline">Вход</Link>
              <AuthButton />
              <ThemeToggle />
            </nav>
          </div>
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
        </header>
        <SWRProvider>{children}</SWRProvider>
        <Footer />
      </body>
    </html>
  );
}
