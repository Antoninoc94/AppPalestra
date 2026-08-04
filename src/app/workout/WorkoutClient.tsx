"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Check, Timer, ChevronDown, ChevronUp, Dumbbell, Flag } from "lucide-react";
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

export function WorkoutClient({ programs, allExercises }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"select" | "active" | "done">("select");
  const [selectedDay, setSelectedDay] = useState<ProgramDay | null>(null);
  const [logExercises, setLogExercises] = useState<LogExercise[]>([]);
  const [expandedEx, setExpandedEx] = useState<number | null>(0);
  const [restTimer, setRestTimer] = useState<{ seconds: number; running: boolean } | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime] = useState(() => new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [freeExSearch, setFreeExSearch] = useState("");
  const [showExPicker, setShowExPicker] = useState(false);

  // Session timer
  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Rest timer
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
        i === exIndex
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
          : ex
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
                if (nowDone) setRestTimer({ seconds: ex.restSeconds, running: true });
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
      setPhase("select");
      return;
    }

    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programId: programs.find((p) => p.days.some((d) => d.id === selectedDay?.id))?.id ?? null,
        programDayId: selectedDay?.id ?? null,
        notes: sessionNotes || null,
        sets: allSets,
      }),
    });

    setSaving(false);
    setPhase("done");
  }

  const completedSets = logExercises.flatMap((ex) => ex.sets).filter((s) => s.done).length;
  const totalSets = logExercises.flatMap((ex) => ex.sets).length;
  const filteredFreeEx = allExercises.filter((ex) =>
    !freeExSearch || (ex.nameIt ?? ex.name).toLowerCase().includes(freeExSearch.toLowerCase())
  );

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
        <Button variant="outline" className="w-full" onClick={() => { setPhase("select"); setElapsed(0); }}>Nuovo allenamento</Button>
      </div>
    );
  }

  if (phase === "select") {
    return (
      <div className="px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold">Inizia allenamento</h1>

        <Button variant="outline" className="w-full gap-2 h-14" onClick={startFreeWorkout}>
          <Plus className="h-5 w-5" />
          Allenamento libero
        </Button>

        {programs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400">Dalle tue schede</h2>
            {programs.map((program) => (
              <div key={program.id} className="space-y-2">
                <p className="text-xs text-zinc-500 font-medium">{program.name}</p>
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
                    <p className="text-zinc-400 text-xs mt-1">
                      {day.exercises.slice(0, 3).map((e) => e.exercise.nameIt ?? e.exercise.name).join(", ")}
                      {day.exercises.length > 3 && "..."}
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

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Active header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold">{selectedDay?.name ?? "Allenamento libero"}</h1>
          <p className="text-zinc-400 text-sm">{formatDuration(elapsed)} • {completedSets}/{totalSets} serie</p>
        </div>
        <button onClick={() => setPhase("select")} className="rounded-xl p-2 hover:bg-zinc-800 transition-colors">
          <X className="h-5 w-5 text-zinc-400" />
        </button>
      </div>

      {/* Rest timer */}
      {restTimer && (
        <div className="rounded-2xl bg-orange-500/10 border border-orange-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-orange-400" />
            <div>
              <p className="text-xs text-orange-300 font-medium">Recupero</p>
              <p className="text-2xl font-bold text-orange-400">{formatDuration(restTimer.seconds)}</p>
            </div>
          </div>
          <button onClick={() => setRestTimer(null)} className="text-orange-300 text-sm font-medium">
            Salta
          </button>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {logExercises.map((ex, exI) => {
          const isExpanded = expandedEx === exI;
          const doneCount = ex.sets.filter((s) => s.done).length;
          return (
            <Card key={exI} className={doneCount === ex.sets.length && ex.sets.length > 0 ? "border-green-500/30" : ""}>
              <CardContent className="p-0">
                <button
                  className="w-full flex items-center justify-between p-4"
                  onClick={() => setExpandedEx(isExpanded ? null : exI)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${doneCount === ex.sets.length && ex.sets.length > 0 ? "bg-green-500/10" : "bg-orange-500/10"}`}>
                      <Dumbbell className={`h-4 w-4 ${doneCount === ex.sets.length && ex.sets.length > 0 ? "text-green-400" : "text-orange-400"}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{ex.name}</p>
                      <p className="text-zinc-500 text-xs">{doneCount}/{ex.sets.length} serie</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {/* Set header */}
                    <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-[10px] text-zinc-500 font-medium px-1">
                      <span>#</span><span>Peso (kg)</span><span>Reps</span><span></span>
                    </div>

                    {ex.sets.map((set, setI) => (
                      <div key={setI} className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center rounded-xl p-2 ${set.done ? "bg-green-500/5" : "bg-zinc-900"}`}>
                        <span className="text-xs text-zinc-500 text-center">{setI + 1}</span>
                        <input
                          type="number"
                          value={set.weight ?? ""}
                          onChange={(e) => updateSet(exI, setI, "weight", e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="—"
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-center focus:outline-none focus:border-orange-500"
                          step={2.5}
                        />
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exI, setI, "reps", parseInt(e.target.value))}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-center focus:outline-none focus:border-orange-500"
                          min={1}
                        />
                        <button
                          onClick={() => toggleSetDone(exI, setI)}
                          className={`rounded-lg h-9 w-9 flex items-center justify-center transition-all ${set.done ? "bg-green-500 text-white" : "border border-zinc-700 bg-zinc-800 text-zinc-500"}`}
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
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-red-400 hover:text-red-300" onClick={() => removeSet(exI, ex.sets.length - 1)}>
                          <X className="h-3 w-3" />
                          Rimuovi
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

      {/* Add exercise */}
      <Button variant="outline" className="w-full gap-2" onClick={() => setShowExPicker(true)}>
        <Plus className="h-4 w-4" />
        Aggiungi esercizio
      </Button>

      {/* Notes */}
      <textarea
        value={sessionNotes}
        onChange={(e) => setSessionNotes(e.target.value)}
        placeholder="Note sull'allenamento..."
        rows={2}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
      />

      {/* Finish */}
      <Button className="w-full h-13 gap-2 text-base" onClick={finishWorkout} disabled={saving || completedSets === 0}>
        <Flag className="h-5 w-5" />
        {saving ? "Salvataggio..." : `Termina allenamento (${completedSets} serie)`}
      </Button>

      {/* Exercise picker */}
      {showExPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end">
          <div className="bg-zinc-950 rounded-t-2xl flex flex-col" style={{ maxHeight: "70dvh" }}>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <h3 className="font-semibold">Aggiungi esercizio</h3>
              <button onClick={() => setShowExPicker(false)}>
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4 shrink-0">
              <input
                type="search"
                placeholder="Cerca esercizio..."
                value={freeExSearch}
                onChange={(e) => setFreeExSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-safe space-y-2">
              {filteredFreeEx.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addFreeExercise(ex)}
                  className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900 p-3 hover:border-orange-500/50 active:bg-zinc-800 transition-colors"
                >
                  <p className="font-medium text-sm">{ex.nameIt ?? ex.name}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{ex.primaryMuscle.nameIt}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
