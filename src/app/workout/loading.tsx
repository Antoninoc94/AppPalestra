export default function WorkoutLoading() {
  return (
    <div className="px-4 py-6 space-y-6 animate-pulse">
      <div className="h-6 w-44 bg-zinc-800 rounded-full" />
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-4 flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-zinc-800 shrink-0" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-zinc-800 rounded-full" />
          <div className="h-3 w-44 bg-zinc-800 rounded-full" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 w-24 bg-zinc-800 rounded-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 bg-zinc-800 rounded-full" />
              <div className="h-5 w-16 bg-zinc-800 rounded-full" />
            </div>
            <div className="h-3 w-48 bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
