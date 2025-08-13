export function ArticleCardSkeleton() {
  return (
    <div className="rounded-3xl border border-divider bg-block shadow-1 p-4 animate-pulse">
      <div className="aspect-[16/9] rounded-2xl bg-tertiary-block" />
      <div className="h-4 bg-tertiary-block mt-3 rounded" />
      <div className="h-4 bg-tertiary-block mt-2 rounded w-2/3" />
      <div className="mt-3 flex items-center gap-2">
        <div className="h-3 w-12 bg-tertiary-block rounded" />
        <div className="h-3 w-16 bg-tertiary-block rounded" />
      </div>
    </div>
  );
}

export function GridSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="puk-grid">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="puk-col-12 md:puk-col-6">
          <ArticleCardSkeleton />
        </div>
      ))}
    </div>
  );
}


