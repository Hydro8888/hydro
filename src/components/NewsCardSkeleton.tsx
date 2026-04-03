export default function NewsCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card bg-surface-card border border-border-muted animate-pulse">
      {/* Image placeholder */}
      <div className="h-[160px] sm:h-[180px] w-full bg-surface-elevated" />

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Meta row */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-4 w-12 rounded-badge bg-surface-elevated" />
          <div className="h-3 w-16 rounded bg-surface-elevated" />
          <div className="h-3 w-20 rounded bg-surface-elevated" />
        </div>

        {/* Title lines */}
        <div className="mb-2 space-y-2">
          <div className="h-4 w-full rounded bg-surface-elevated" />
          <div className="h-4 w-3/4 rounded bg-surface-elevated" />
        </div>

        {/* Summary lines */}
        <div className="mb-3 space-y-1.5">
          <div className="h-3 w-full rounded bg-surface-elevated" />
          <div className="h-3 w-5/6 rounded bg-surface-elevated" />
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border-muted">
          <div className="h-3 w-16 rounded bg-surface-elevated" />
          <div className="h-4 w-4 rounded bg-surface-elevated" />
        </div>
      </div>
    </div>
  );
}
