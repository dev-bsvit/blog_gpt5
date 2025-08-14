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
import DraftsLink from "@/components/DraftsLink";

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
  const apiOrigin = "";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Force light theme: remove dark switching */}
        <script dangerouslySetInnerHTML={{ __html: `
          try { document.documentElement.classList.remove('theme-dark'); localStorage.setItem('theme','light'); } catch(e){}
        ` }} />
        {/* Trix assets moved to write page to avoid loading on all pages */}
        {/* No external API origin needed after migration */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="bg-page sticky top-0 z-50" style={{ borderBottom: "1px solid var(--controlBtnSecondaryBg)" }}>
          <div className="puk-container pt-[24px] pb-[12px]">
            <div className="puk-grid items-center">
              {/* 3: Логотип слева */}
              <div className="puk-col-3 flex items-center">
                <Link href="/" className="inline-flex items-center" aria-label="Home">
                  <Image
                    src="https://firebasestorage.googleapis.com/v0/b/blog-5gpt.firebasestorage.app/o/Logo_graf%2Flogo.svg?alt=media&token=a00517a8-d4e1-4137-a05f-c70d8ae5f795"
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
                <DraftsLink />
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
