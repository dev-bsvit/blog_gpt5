import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
import Link from "next/link";
import Image from "next/image";
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
        {/* Force light theme: remove dark switching */}
        <script dangerouslySetInnerHTML={{ __html: `
          try { document.documentElement.classList.remove('theme-dark'); localStorage.setItem('theme','light'); } catch(e){}
        ` }} />
        {/* Trix assets moved to write page to avoid loading on all pages */}
        {apiOrigin && (
          <>
            <link rel="preconnect" href={apiOrigin} crossOrigin="" />
            <link rel="dns-prefetch" href={apiOrigin} />
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="bg-page" style={{ borderBottom: "1px solid var(--controlBtnSecondaryBg)" }}>
          <div className="puk-container pt-[24px] pb-[12px]">
            <div className="puk-grid items-center">
              {/* 3: Логотип слева */}
              <div className="puk-col-3 flex items-center">
                <Link href="/" className="inline-flex items-center" aria-label="Home">
                  <Image
                    src="https://firebasestorage.googleapis.com/v0/b/blog-5gpt.firebasestorage.app/o/Logo_graf%2FSVG.svg?alt=media&token=efba6aa9-d6bd-4a0d-bc52-4476757be9ea"
                    alt="Logo"
                    width={120}
                    height={32}
                    priority
                  />
                </Link>
              </div>
              {/* 8: Поиск по центру */}
              <div className="puk-col-8 flex justify-center">
                <div className="w-full" style={{ maxWidth: "unset" }}>
                  <HeaderSearch />
                </div>
              </div>
              {/* 3: Кнопка написать + аватар справа */}
              <nav className="puk-col-3 flex items-center justify-end gap-3 ty-body">
                <WriteGuardLink />
                <AuthButton />
              </nav>
            </div>
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
