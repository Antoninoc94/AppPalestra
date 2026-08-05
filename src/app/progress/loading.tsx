export default function ProgressLoading() {
  return (
    <div className="px-4 py-6 space-y-6 pb-24 animate-pulse">
      <div className="h-6 w-28 bg-zinc-800 rounded-full" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 flex flex-col items-center gap-2">
            <div className="h-7 w-10 bg-zinc-800 rounded-full" />
            <div className="h-3 w-16 bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>

      {/* Personal records */}
      <div className="space-y-3">
        <div className="h-4 w-36 bg-zinc-800 rounded-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 flex items-center justify-between">
            <div className="h-4 w-32 bg-zinc-800 rounded-full" />
            <div className="h-5 w-16 bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="space-y-3">
        <div className="h-4 w-44 bg-zinc-800 rounded-full" />
        <div className="h-10 rounded-xl bg-zinc-800" />
        <div className="h-56 rounded-xl border border-zinc-800 bg-zinc-900" />
      </div>

      {/* Sessions */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-zinc-800 rounded-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-zinc-800 rounded-full" />
              <div className="h-3 w-24 bg-zinc-800 rounded-full" />
            </div>
            <div className="h-5 w-14 bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
