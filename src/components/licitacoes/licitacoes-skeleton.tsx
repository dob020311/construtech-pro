export function LicitacoesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-28 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-4 flex-1 rounded" />
              <div className="skeleton h-6 w-24 rounded-full" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
