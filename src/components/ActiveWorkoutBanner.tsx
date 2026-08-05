"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Dumbbell, ChevronRight, Timer, X } from "lucide-react";
import { formatDuration } from "@/lib/utils";

const storageKey = (userId: string) => `apppalestra-workout-${userId}`;

export function ActiveWorkoutBanner({ userId }: { userId: string }) {
  const [active, setActive] = useState(false);
  const [dayName, setDayName] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [restExpiresAt, setRestExpiresAt] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(90);
  const [restRemaining, setRestRemaining] = useState(0);
  const initializedRef = useRef(false);

  const readStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (!raw) {
        setActive(false);
        initializedRef.current = false;
        return;
      }
      const data = JSON.parse(raw);
      if (data.phase !== "active") {
        setActive(false);
        initializedRef.current = false;
        return;
      }

      const logs: Array<{ sets: Array<{ done: boolean }> }> = data.logExercises ?? [];
      const d = logs.flatMap((ex) => ex.sets).filter((s) => s.done).length;
      const t = logs.flatMap((ex) => ex.sets).length;

      setActive(true);
      setDayName(data.selectedDayName ?? null);
      setDone(d);
      setTotal(t);

      // Only sync elapsed from storage on first load — after that the local counter runs
      if (!initializedRef.current) {
        setElapsed(data.elapsed ?? 0);
        initializedRef.current = true;
      }

      const exp: number | null = data.restTimerExpiresAt ?? null;
      setRestExpiresAt(exp);
      setRestTotal(data.restTimerTotal ?? 90);
      if (exp) {
        const rem = Math.ceil((exp - Date.now()) / 1000);
        setRestRemaining(rem > 0 ? rem : 0);
      } else {
        setRestRemaining(0);
      }
    } catch {
      setActive(false);
    }
  }, [userId]);

  // Initial read + cleanup old key + poll every 2s to pick up rest timer changes from workout tab
  useEffect(() => {
    localStorage.removeItem("apppalestra-workout-v1");
    readStorage();
    const iv = setInterval(readStorage, 2000);
    return () => clearInterval(iv);
  }, [readStorage]);

  // Live elapsed counter — starts once workout is active, independent of polling
  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(iv);
  }, [active]);

  // Live rest countdown — tied to restExpiresAt timestamp so it's always accurate
  useEffect(() => {
    if (!restExpiresAt) return;
    const iv = setInterval(() => {
      const rem = Math.ceil((restExpiresAt - Date.now()) / 1000);
      setRestRemaining(rem > 0 ? rem : 0);
      if (rem <= 0) setRestExpiresAt(null);
    }, 500);
    return () => clearInterval(iv);
  }, [restExpiresAt]);

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.removeItem(storageKey(userId)); } catch {}
    fetch("/api/workout/draft", { method: "DELETE" }).catch(() => {});
    setActive(false);
    initializedRef.current = false;
  }

  if (!active) return null;

  const hasRest = !!restExpiresAt && restRemaining > 0;
  const restPct = hasRest ? Math.min(100, (restRemaining / restTotal) * 100) : 0;

  return (
    <Link href="/workout">
      <div
        className={`rounded-2xl border transition-all active:opacity-80 overflow-hidden ${
          hasRest
            ? "border-orange-500/50 bg-orange-500/10"
            : "border-orange-500/30 bg-orange-500/5"
        }`}
      >
        {/* Riga principale */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className={`rounded-xl p-2.5 shrink-0 ${hasRest ? "bg-orange-500" : "bg-orange-500/80"}`}>
            {hasRest
              ? <Timer className="h-4 w-4 text-white" />
              : <Dumbbell className="h-4 w-4 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-orange-100">Allenamento in corso</p>
            <p className="text-orange-300/70 text-xs mt-0.5 truncate">
              {dayName ?? "Allenamento libero"} · {done}/{total} serie · {formatDuration(elapsed)}
            </p>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 p-1 text-orange-400/60 hover:text-orange-300 transition-colors"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
          <ChevronRight className="h-4 w-4 text-orange-400 shrink-0" />
        </div>

        {/* Timer recupero — visibile solo quando attivo */}
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
