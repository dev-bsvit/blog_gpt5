import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
import FancyLoader from "@/components/FancyLoader";
import Link from "next/link";
import SWRProvider from "@/components/SWRProvider";
import WriteGuardLink from "@/components/WriteGuardLink";
import TopProgressBar from "@/components/TopProgressBar";

const geistSans = Geist({
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FancyLoader route />
        <header className="border-b sticky top-0 bg-white/60 dark:bg-black/40 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
            <Link href="/" className="font-semibold">Blog MVP</Link>
            <nav className="flex items-center gap-4 text-sm">
              <WriteGuardLink />
              <Link href="/drafts" className="underline hidden sm:inline">Черновики</Link>
              <Link href="/bookmarks" className="underline hidden sm:inline">Закладки</Link>
              <Link href="/my" className="underline hidden sm:inline">Мои статьи</Link>
              <Link href="/search" className="underline hidden sm:inline">Поиск</Link>
              <Link href="/rss.xml" className="underline hidden sm:inline" title="RSS">RSS</Link>
              <Link href="/login" className="underline hidden sm:inline">Вход</Link>
              <AuthButton />
            </nav>
          </div>
          <TopProgressBar />
        </header>
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
