export default function Footer() {
  return (
    <footer className="mt-8 border-t border-divider">
      <div className="max-w-6xl mx-auto pad-4d ty-meta flex flex-col sm:flex-row items-center justify-between gap-3d">
        <div>© {new Date().getFullYear()} UI/UX Блог</div>
        <nav className="flex items-center gap-3d">
          <a className="underline" href="/rss.xml">RSS</a>
          <a className="underline" href="/">Все статьи</a>
          <a className="underline" href="/search">Поиск</a>
        </nav>
      </div>
    </footer>
  );
}


