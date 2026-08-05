export default function ProgramsLoading() {
  return (
    <div className="px-4 py-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 bg-zinc-800 rounded-full" />
        <div className="h-9 w-32 bg-zinc-800 rounded-xl" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 bg-zinc-800 rounded-full" />
            <div className="h-5 w-16 bg-zinc-800 rounded-full" />
          </div>
          <div className="h-3 w-24 bg-zinc-800 rounded-full" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 rounded-xl bg-zinc-800" />
            <div className="h-8 rounded-xl bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
