"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, ChevronRight } from "lucide-react";
import { formatDuration } from "@/lib/utils";

const STORAGE_KEY = "apppalestra-workout-v1";

export function ActiveWorkoutBanner() {
  const [info, setInfo] = useState<{ dayName: string | null; elapsed: number; done: number; total: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.phase !== "active") return;
      const logs: Array<{ sets: Array<{ done: boolean }> }> = data.logExercises ?? [];
      const done = logs.flatMap((ex) => ex.sets).filter((s) => s.done).length;
      const total = logs.flatMap((ex) => ex.sets).length;
      setInfo({ dayName: data.selectedDayName ?? null, elapsed: data.elapsed ?? 0, done, total });
    } catch {}
  }, []);

  if (!info) return null;

  return (
    <Link href="/workout">
      <div className="flex items-center gap-3 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 active:bg-orange-500/20 transition-colors">
        <div className="rounded-xl bg-orange-500 p-2.5 shrink-0">
          <Dumbbell className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-orange-100">Allenamento in corso</p>
          <p className="text-orange-300/80 text-xs mt-0.5 truncate">
            {info.dayName ?? "Allenamento libero"} · {info.done}/{info.total} serie · {formatDuration(info.elapsed)}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-orange-400 shrink-0" />
      </div>
    </Link>
  );
}
