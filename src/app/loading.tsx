export default function HomeLoading() {
  return (
    <div className="px-4 py-6 space-y-5 pb-28 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-3 w-32 bg-zinc-800 rounded-full" />
        <div className="h-7 w-56 bg-zinc-800 rounded-full" />
        <div className="h-3 w-44 bg-zinc-800 rounded-full" />
      </div>

      {/* Activity strip */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
        <div className="h-3 w-40 bg-zinc-800 rounded-full mb-3" />
        <div className="flex justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-9 w-9 rounded-full bg-zinc-800" />
              <div className="h-2 w-5 bg-zinc-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick start card */}
      <div className="h-36 rounded-2xl bg-zinc-800" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <div className="h-8 w-8 rounded-lg bg-zinc-800" />
            <div className="h-7 w-12 bg-zinc-800 rounded-full" />
            <div className="h-3 w-24 bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
