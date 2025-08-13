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
        <header className="border-b border-divider sticky top-0 z-10 backdrop-blur bg-block">
          <div className="max-w-6xl mx-auto grid grid-cols-3 items-center gap-4d pad-4d">
            <div className="flex items-center gap-4d">
              <Link href="/" className="inline-flex items-center" aria-label="Home">
                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/blog-5gpt.firebasestorage.app/o/Logo_graf%2Flogo.svg?alt=media&token=a00517a8-d4e1-4137-a05f-c70d8ae5f795"
                  alt="Logo"
                  width={120}
                  height={32}
                  priority
                />
              </Link>
              {/* RSS link hidden per request */}
            </div>
            <div className="flex justify-center">
              <HeaderSearch />
            </div>
            <nav className="flex items-center justify-end gap-3d ty-body">
              <WriteGuardLink />
              <AuthButton />
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
