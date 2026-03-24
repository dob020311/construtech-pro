export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-9 w-9 rounded-lg" />
            </div>
            <div className="skeleton h-8 w-32 rounded mb-2" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="skeleton h-5 w-40 rounded mb-4" />
          <div className="skeleton h-64 w-full rounded-lg" />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="skeleton h-5 w-40 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                <div className="skeleton h-4 w-4 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-3 w-full rounded mb-1" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
