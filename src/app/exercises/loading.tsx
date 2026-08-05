export default function ExercisesLoading() {
  return (
    <div className="px-4 py-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-zinc-800 rounded-full" />
        <div className="h-4 w-20 bg-zinc-800 rounded-full" />
      </div>
      <div className="h-12 rounded-xl bg-zinc-800" />
      <div className="h-8 w-24 rounded-lg bg-zinc-800" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-800 shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-zinc-800 rounded-full" />
                  <div className="h-3 w-24 bg-zinc-800 rounded-full" />
                </div>
              </div>
              <div className="h-5 w-16 rounded-full bg-zinc-800 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
