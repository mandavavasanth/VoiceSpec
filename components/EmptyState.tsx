'use client';

export function EmptyState() {
  return (
    <div className="flex flex-col h-full space-y-6 p-8 animate-in fade-in opacity-50 select-none pointer-events-none">
      {/* Skeleton Header */}
      <div className="w-1/3 h-6 bg-slate/10 rounded" />

      {/* Skeleton Section 1 */}
      <div className="space-y-4">
        <div className="w-1/4 h-5 bg-slate/10 rounded" />
        <div className="flex gap-3">
          <div className="w-12 h-5 bg-slate/5 rounded" />
          <div className="flex-1 space-y-2">
            <div className="w-full h-4 bg-slate/5 rounded" />
            <div className="w-4/5 h-4 bg-slate/5 rounded" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-12 h-5 bg-slate/5 rounded" />
          <div className="flex-1 space-y-2">
            <div className="w-11/12 h-4 bg-slate/5 rounded" />
            <div className="w-3/4 h-4 bg-slate/5 rounded" />
          </div>
        </div>
      </div>

      {/* Skeleton Section 2 */}
      <div className="space-y-4 pt-4">
        <div className="w-1/5 h-5 bg-slate/10 rounded" />
        <div className="flex gap-3">
          <div className="w-12 h-5 bg-slate/5 rounded" />
          <div className="flex-1 space-y-2">
            <div className="w-full h-4 bg-slate/5 rounded" />
            <div className="w-5/6 h-4 bg-slate/5 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
