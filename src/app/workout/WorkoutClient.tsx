"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Check, Timer, ChevronDown, ChevronUp, Dumbbell, Flag, AlertTriangle, Filter } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface Exercise { id: string; name: string; nameIt: string | null; primaryMuscle: { nameIt: string } }
interface ProgramExercise { exerciseId: string; exercise: Exercise; sets: number; reps: string; restSeconds: number; weight: number | null }
interface ProgramDay { id: string; name: string; exercises: ProgramExercise[] }
interface Program { id: string; name: string; days: ProgramDay[] }

interface LogSet { reps: number; weight: number | null; done: boolean }
interface LogExercise { exerciseId: string; name: string; sets: LogSet[]; targetReps: string; restSeconds: number }

interface Props {
  programs: Program[];
  allExercises: Exercise[];
}

const storageKey = (userId: string) => `apppalestra-workout-${userId}`;

export function WorkoutClient({ programs, allExercises, userId }: Props & { userId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"select" | "active" | "done">("select");
  const [selectedDay, setSelectedDay] = useState<ProgramDay | null>(null);
  const [logExercises, setLogExercises] = useState<LogExercise[]>([]);
  const [expandedEx, setExpandedEx] = useState<number | null>(0);
  const [restTimer, setRestTimer] = useState<{ seconds: number; running: boolean; expiresAt: number; total: number } | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [freeExSearch, setFreeExSearch] = useState("");
  const [showExPicker, setShowExPicker] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [noSetsError, setNoSetsError] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState("");

  function clearWorkoutStorage() {
    try { localStorage.removeItem(storageKey(userId)); } catch {}
  }

  // Restore active workout from localStorage (survives tab changes)
  useEffect(() => {
    try {
      localStorage.removeItem("apppalestra-workout-v1"); // cleanup old shared key
      const raw = localStorage.getItem(storageKey(userId));
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.phase !== "active") return;
      const day = data.selectedDayId
        ? programs.flatMap((p) => p.days).find((d) => d.id === data.selectedDayId) ?? null
        : null;
      setSelectedDay(day);
      setLogExercises(data.logExercises ?? []);
      setElapsed(data.elapsed ?? 0);
      setSessionNotes(data.sessionNotes ?? "");
      setExpandedEx(data.expandedEx ?? 0);
      if (data.restTimerExpiresAt) {
        const remaining = Math.ceil((data.restTimerExpiresAt - Date.now()) / 1000);
        if (remaining > 0) {
          setRestTimer({ seconds: remaining, running: true, expiresAt: data.restTimerExpiresAt, total: data.restTimerTotal ?? remaining });
        }
      }
      setPhase("active");
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist workout state while active
  useEffect(() => {
    if (phase !== "active") return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify({
        phase,
        selectedDayId: selectedDay?.id ?? null,
        selectedDayName: selectedDay?.name ?? null,
        logExercises,
        elapsed,
        sessionNotes,
        expandedEx,
        restTimerExpiresAt: restTimer?.expiresAt ?? null,
        restTimerTotal: restTimer?.total ?? null,
      }));
    } catch {}
  }, [phase, selectedDay, logExercises, elapsed, sessionNotes, expandedEx, restTimer]);

  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (restTimer?.running) {
      restRef.current = setInterval(() => {
        setRestTimer((prev) => {
          if (!prev || prev.seconds <= 1) {
            clearInterval(restRef.current!);
            return null;
          }
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    }
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restTimer?.running]);

  function startFromDay(day: ProgramDay) {
    setSelectedDay(day);
    setLogExercises(
      day.exercises.map((pe) => ({
        exerciseId: pe.exerciseId,
        name: pe.exercise.nameIt ?? pe.exercise.name,
        targetReps: pe.reps,
        restSeconds: pe.restSeconds,
        sets: Array.from({ length: pe.sets }, () => ({
          reps: parseInt(pe.reps) || 10,
          weight: pe.weight ?? null,
          done: false,
        })),
      }))
    );
    setPhase("active");
    setExpandedEx(0);
  }

  function startFreeWorkout() {
    setSelectedDay(null);
    setLogExercises([]);
    setPhase("active");
  }

  function addFreeExercise(ex: Exercise) {
    setLogExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.nameIt ?? ex.name,
        targetReps: "10",
        restSeconds: 90,
        sets: [{ reps: 10, weight: null, done: false }],
      },
    ]);
    setShowExPicker(false);
    setExpandedEx(logExercises.length);
  }

  function addSet(exIndex: number) {
    setLogExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: [...ex.sets, { reps: ex.sets[ex.sets.length - 1]?.reps ?? 10, weight: ex.sets[ex.sets.length - 1]?.weight ?? null, done: false }] }
          : ex
      )
    );
  }

  function removeSet(exIndex: number, setIndex: number) {
    setLogExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) } : ex
      )
    );
  }

  function toggleSetDone(exIndex: number, setIndex: number) {
    setLogExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, j) => {
                if (j !== setIndex) return s;
                const nowDone = !s.done;
                if (nowDone) {
                  setRestTimer({ seconds: ex.restSeconds, running: true, expiresAt: Date.now() + ex.restSeconds * 1000, total: ex.restSeconds });
                } else {
                  if (restRef.current) clearInterval(restRef.current);
                  setRestTimer(null);
                }
                return { ...s, done: nowDone };
              }),
            }
          : ex
      )
    );
  }

  function updateSet(exIndex: number, setIndex: number, field: "reps" | "weight", value: number | null) {
    setLogExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: ex.sets.map((s, j) => j === setIndex ? { ...s, [field]: value } : s) }
          : ex
      )
    );
  }

  async function finishWorkout() {
    setSaving(true);
    const allSets = logExercises.flatMap((ex) =>
      ex.sets
        .filter((s) => s.done)
        .map((s, j) => ({
          exerciseId: ex.exerciseId,
          setNumber: j + 1,
          reps: s.reps,
          weight: s.weight,
          restSeconds: ex.restSeconds,
        }))
    );

    if (allSets.length === 0) {
      setSaving(false);
      setNoSetsError(true);
      setTimeout(() => setNoSetsError(false), 3000);
      return;
    }

    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programId: programs.find((p) => p.days.some((d) => d.id === selectedDay?.id))?.id ?? null,
        programDayId: selectedDay?.id ?? null,
        notes: sessionNotes || null,
        duration: elapsed,
        sets: allSets,
      }),
    });

    clearWorkoutStorage();
    setSaving(false);
    setPhase("done");
  }

  const completedSets = logExercises.flatMap((ex) => ex.sets).filter((s) => s.done).length;
  const totalSets = logExercises.flatMap((ex) => ex.sets).length;
  const muscleGroups = Array.from(new Set(allExercises.map((ex) => ex.primaryMuscle.nameIt))).sort();

  const filteredFreeEx = allExercises.filter((ex) => {
    const matchName = !freeExSearch || (ex.nameIt ?? ex.name).toLowerCase().includes(freeExSearch.toLowerCase());
    const matchMuscle = !muscleFilter || ex.primaryMuscle.nameIt === muscleFilter;
    return matchName && matchMuscle;
  });

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="px-4 py-16 text-center space-y-6">
        <div className="rounded-full bg-green-500/10 p-6 w-24 h-24 mx-auto flex items-center justify-center">
          <Flag className="h-10 w-10 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ottimo lavoro!</h1>
          <p className="text-zinc-400 mt-2">{completedSets} serie completate in {formatDuration(elapsed)}</p>
        </div>
        <Button className="w-full" onClick={() => router.push("/")}>Torna alla home</Button>
        <Button variant="outline" className="w-full" onClick={() => { setPhase("select"); setElapsed(0); setSessionNotes(""); }}>
          Nuovo allenamento
        </Button>
      </div>
    );
  }

  // ── SELECT ────────────────────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold">Inizia allenamento</h1>

        <button
          onClick={startFreeWorkout}
          className="w-full rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-4 flex items-center gap-4 hover:border-orange-500/40 hover:bg-zinc-900 transition-all active:bg-zinc-800 text-left"
        >
          <div className="rounded-xl bg-orange-500/10 p-3 shrink-0">
            <Plus className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="font-semibold">Allenamento libero</p>
            <p className="text-zinc-500 text-xs mt-0.5">Scegli gli esercizi al momento</p>
          </div>
        </button>

        {programs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dalle tue schede</h2>
            {programs.map((program) => (
              <div key={program.id} className="space-y-2">
                <p className="text-xs text-zinc-500 font-medium pl-1">{program.name}</p>
                {program.days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => startFromDay(day)}
                    className="w-full text-left rounded-2xl border border-zinc-800 bg-zinc-900 p-4 hover:border-orange-500/50 active:bg-zinc-800 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{day.name}</p>
                      <Badge variant="secondary">{day.exercises.length} esercizi</Badge>
                    </div>
                    <p className="text-zinc-400 text-xs mt-1 truncate">
                      {day.exercises.slice(0, 3).map((e) => e.exercise.nameIt ?? e.exercise.name).join(", ")}
                      {day.exercises.length > 3 && ` +${day.exercises.length - 3}`}
                    </p>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── ACTIVE ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-40">
      {/* Sticky header: timer / progress bar */}
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-zinc-800/50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm truncate">{selectedDay?.name ?? "Allenamento libero"}</p>
            {restTimer ? (
              <div className="flex items-center gap-2 mt-0.5">
                <Timer className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                <span className="text-orange-400 font-bold tabular-nums">{formatDuration(restTimer.seconds)}</span>
                <span className="text-zinc-500 text-xs">recupero</span>
                <button
                  onClick={() => setRestTimer(null)}
                  className="text-zinc-500 text-xs underline ml-1"
                >
                  Salta
                </button>
              </div>
            ) : (
              <p className="text-zinc-400 text-xs mt-0.5 tabular-nums">
                {formatDuration(elapsed)} · {completedSets}/{totalSets} serie
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAbandonConfirm(true)}
            className="rounded-xl p-2 hover:bg-zinc-800 transition-colors shrink-0"
            title="Abbandona allenamento"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {totalSets > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.round((completedSets / totalSets) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="px-4 pt-4 space-y-4">
        {/* Exercise list */}
        <div className="space-y-3">
          {logExercises.map((ex, exI) => {
            const isExpanded = expandedEx === exI;
            const doneCount = ex.sets.filter((s) => s.done).length;
            const allDone = doneCount === ex.sets.length && ex.sets.length > 0;
            return (
              <Card key={exI} className={allDone ? "border-green-500/30" : ""}>
                <CardContent className="p-0">
                  <button
                    className="w-full flex items-center justify-between p-4"
                    onClick={() => setExpandedEx(isExpanded ? null : exI)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${allDone ? "bg-green-500/10" : "bg-orange-500/10"}`}>
                        <Dumbbell className={`h-4 w-4 ${allDone ? "text-green-400" : "text-orange-400"}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{ex.name}</p>
                        <p className="text-zinc-500 text-xs">{doneCount}/{ex.sets.length} serie</p>
                      </div>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                    }
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      <div className="grid grid-cols-[1.5rem_1fr_1fr_2.75rem] gap-2 text-[10px] text-zinc-500 font-medium px-1 mb-1">
                        <span>#</span>
                        <span className="text-center">Peso (kg)</span>
                        <span className="text-center">Reps</span>
                        <span />
                      </div>

                      {ex.sets.map((set, setI) => (
                        <div
                          key={setI}
                          className={`grid grid-cols-[1.5rem_1fr_1fr_2.75rem] gap-2 items-center rounded-xl px-2 py-1 transition-colors ${set.done ? "bg-green-500/5" : "bg-zinc-900"}`}
                        >
                          <span className="text-xs text-zinc-500 text-center font-medium">{setI + 1}</span>
                          <input
                            type="number"
                            value={set.weight ?? ""}
                            onChange={(e) => updateSet(exI, setI, "weight", e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="—"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2.5 text-sm text-center focus:outline-none focus:border-orange-500"
                            step={2.5}
                          />
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(exI, setI, "reps", parseInt(e.target.value))}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2.5 text-sm text-center focus:outline-none focus:border-orange-500"
                            min={1}
                          />
                          <button
                            onClick={() => toggleSetDone(exI, setI)}
                            className={`rounded-lg h-10 w-10 flex items-center justify-center transition-all ${
                              set.done
                                ? "bg-green-500 text-white"
                                : "border border-zinc-700 bg-zinc-800 text-zinc-500 active:bg-zinc-700"
                            }`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2 pt-1">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => addSet(exI)}>
                          <Plus className="h-3 w-3" />
                          Serie
                        </Button>
                        {ex.sets.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs text-red-400 hover:text-red-300"
                            onClick={() => removeSet(exI, ex.sets.length - 1)}
                          >
                            <X className="h-3 w-3" />
                            Rimuovi ultima
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button variant="outline" className="w-full gap-2" onClick={() => setShowExPicker(true)}>
          <Plus className="h-4 w-4" />
          Aggiungi esercizio
        </Button>

        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="Note sull'allenamento..."
          rows={2}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
        />
      </div>

      {/* Fixed finish button — above bottom nav */}
      <div className="fixed bottom-16 inset-x-0 z-30">
        <div className="max-w-lg mx-auto px-4 pt-2.5 pb-2.5 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800/60">
          <Button
            className="w-full h-12 gap-2 font-semibold"
            onClick={finishWorkout}
            disabled={saving || completedSets === 0}
          >
            <Flag className="h-4 w-4" />
            {saving ? "Salvataggio..." : `Termina · ${completedSets}/${totalSets} serie`}
          </Button>
        </div>
      </div>

      {/* No sets error toast */}
      {noSetsError && (
        <div className="fixed bottom-32 inset-x-0 z-40 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm text-zinc-100 shadow-xl">
            <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
            Completa almeno una serie prima di terminare
          </div>
        </div>
      )}

      {/* Abandon confirmation dialog */}
      {showAbandonConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-500/10 p-2.5 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold">Abbandonare l&apos;allenamento?</p>
                <p className="text-zinc-400 text-sm mt-0.5">I progressi non salvati andranno persi.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => { clearWorkoutStorage(); setShowAbandonConfirm(false); setPhase("select"); setElapsed(0); setSessionNotes(""); setLogExercises([]); setSelectedDay(null); }}
              >
                Abbandona
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowAbandonConfirm(false)}>
                Continua
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise picker modal */}
      {showExPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end">
          <div className="bg-zinc-950 rounded-t-2xl flex flex-col" style={{ maxHeight: "75dvh" }}>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <h3 className="font-semibold">Aggiungi esercizio</h3>
              <button onClick={() => { setShowExPicker(false); setFreeExSearch(""); setMuscleFilter(""); }}>
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            <div className="px-4 pt-3 pb-2 shrink-0 space-y-2">
              <input
                type="search"
                placeholder="Cerca esercizio..."
                value={freeExSearch}
                onChange={(e) => setFreeExSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                autoFocus
              />
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => setMuscleFilter("")}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    !muscleFilter ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  <Filter className="h-3 w-3" />
                  Tutti
                </button>
                {muscleGroups.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMuscleFilter(m === muscleFilter ? "" : m)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      muscleFilter === m ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-safe space-y-2">
              {filteredFreeEx.length === 0 ? (
                <p className="text-center text-zinc-500 text-sm py-8">Nessun esercizio trovato</p>
              ) : (
                filteredFreeEx.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addFreeExercise(ex)}
                    className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900 p-3 hover:border-orange-500/50 active:bg-zinc-800 transition-colors"
                  >
                    <p className="font-medium text-sm">{ex.nameIt ?? ex.name}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">{ex.primaryMuscle.nameIt}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
