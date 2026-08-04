"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, ChevronRight, Timer } from "lucide-react";
import { formatDuration } from "@/lib/utils";

const storageKey = (userId: string) => `apppalestra-workout-${userId}`;

interface BannerState {
  dayName: string | null;
  elapsed: number;
  done: number;
  total: number;
  currentExercise: string | null;
  restExpiresAt: number | null;
  restTotal: number;
}

export function ActiveWorkoutBanner({ userId }: { userId: string }) {
  const [info, setInfo] = useState<BannerState | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);

  useEffect(() => {
    try {
      localStorage.removeItem("apppalestra-workout-v1"); // cleanup old shared key
      const raw = localStorage.getItem(storageKey(userId));
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.phase !== "active") return;

      const logs: Array<{ sets: Array<{ done: boolean }>; name: string }> = data.logExercises ?? [];
      const done = logs.flatMap((ex) => ex.sets).filter((s) => s.done).length;
      const total = logs.flatMap((ex) => ex.sets).length;
      const currentExercise =
        typeof data.expandedEx === "number" ? (logs[data.expandedEx]?.name ?? null) : null;

      const restExpiresAt: number | null = data.restTimerExpiresAt ?? null;
      const restTotal: number = data.restTimerTotal ?? 90;

      setInfo({ dayName: data.selectedDayName ?? null, elapsed: data.elapsed ?? 0, done, total, currentExercise, restExpiresAt, restTotal });

      if (restExpiresAt) {
        const rem = Math.ceil((restExpiresAt - Date.now()) / 1000);
        setRestRemaining(rem > 0 ? rem : 0);
      }
    } catch {}
  }, [userId]);

  // Live countdown for rest timer
  useEffect(() => {
    if (!info?.restExpiresAt) return;
    const iv = setInterval(() => {
      const rem = Math.ceil((info.restExpiresAt! - Date.now()) / 1000);
      if (rem <= 0) {
        setRestRemaining(0);
        setInfo((prev) => (prev ? { ...prev, restExpiresAt: null } : null));
      } else {
        setRestRemaining(rem);
      }
    }, 500);
    return () => clearInterval(iv);
  }, [info?.restExpiresAt]);

  if (!info) return null;

  const hasRest = !!info.restExpiresAt && restRemaining > 0;
  const restPct = hasRest ? Math.min(100, (restRemaining / info.restTotal) * 100) : 0;

  return (
    <Link href="/workout">
      <div
        className={`rounded-2xl border transition-all active:opacity-80 overflow-hidden ${
          hasRest
            ? "border-orange-500/50 bg-orange-500/10"
            : "border-orange-500/30 bg-orange-500/5"
        }`}
      >
        {/* Top row — always visible */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className={`rounded-xl p-2.5 shrink-0 ${hasRest ? "bg-orange-500" : "bg-orange-500/80"}`}>
            {hasRest
              ? <Timer className="h-4 w-4 text-white" />
              : <Dumbbell className="h-4 w-4 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-orange-100">Allenamento in corso</p>
            <p className="text-orange-300/70 text-xs mt-0.5 truncate">
              {info.dayName ?? "Allenamento libero"} · {info.done}/{info.total} serie · {formatDuration(info.elapsed)}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-orange-400 shrink-0" />
        </div>

        {/* Rest timer — shown only when active */}
        {hasRest && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold text-orange-300/60 uppercase tracking-widest">
                  Recupero
                </p>
                <p className="text-3xl font-bold tabular-nums text-orange-100 leading-none mt-1">
                  {formatDuration(restRemaining)}
                </p>
              </div>
              <p className="text-xs text-orange-300/50 pb-0.5">Tocca per gestire</p>
            </div>
            <div className="h-1.5 rounded-full bg-orange-500/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-500 ease-linear"
                style={{ width: `${restPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
