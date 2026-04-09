export default function Loading() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 animate-fade-in">
      {/* Hero skeleton */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 rounded-card bg-surface-card shimmer" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-24 h-16 rounded-badge bg-surface-card shimmer shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-full rounded bg-surface-elevated shimmer" />
                <div className="h-3 w-2/3 rounded bg-surface-elevated shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section header skeleton */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-4 w-20 rounded bg-surface-elevated shimmer" />
        <div className="flex-1 h-px bg-border-muted" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-card overflow-hidden bg-surface-card">
            <div className="h-40 bg-surface-elevated shimmer" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-1/4 rounded bg-surface-elevated shimmer" />
              <div className="h-4 w-full rounded bg-surface-elevated shimmer" />
              <div className="h-4 w-3/4 rounded bg-surface-elevated shimmer" />
              <div className="h-3 w-1/3 rounded bg-surface-elevated shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
