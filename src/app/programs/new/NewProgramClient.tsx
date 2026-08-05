"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronLeft, Dumbbell, Sparkles, GripVertical, X, RefreshCw, Info } from "lucide-react";
import { getGoalLabel, getDifficultyLabel } from "@/lib/utils";
import { ExerciseInfoSheet } from "@/components/ExerciseInfoSheet";
import type { ExerciseWithRelations } from "@/types";

interface MuscleGroup { id: string; name: string; nameIt: string }
interface Equipment { id: string; name: string; nameIt: string }

interface DayExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
  weight?: number;
  notes?: string;
}

interface ProgramDay {
  name: string;
  dayNumber: number;
  exercises: DayExercise[];
}

interface Props {
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  exercises: ExerciseWithRelations[];
}

const GOALS = ["strength", "hypertrophy", "endurance", "weight_loss", "general"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const DURATIONS = [30, 45, 60, 75, 90];

export function NewProgramClient({ muscleGroups, equipment, exercises }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"meta" | "days" | "generate">("meta");

  // Program meta
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("hypertrophy");

  // Days
  const [days, setDays] = useState<ProgramDay[]>([
    { name: "Giorno A", dayNumber: 1, exercises: [] },
  ]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Exercise picker
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerMuscle, setPickerMuscle] = useState("");

  // Generator
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [genGoal, setGenGoal] = useState("hypertrophy");
  const [genDifficulty, setGenDifficulty] = useState("intermediate");
  const [genDuration, setGenDuration] = useState(60);
  const [genEquipmentPref, setGenEquipmentPref] = useState<"bodyweight" | "equipment" | "any">("any");
  const [generating, setGenerating] = useState(false);
  const [generatedDays, setGeneratedDays] = useState<ProgramDay[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mode, setMode] = useState<"manual" | "generate">("manual");
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [replaceSearch, setReplaceSearch] = useState("");
  const [infoExercise, setInfoExercise] = useState<ExerciseWithRelations | null>(null);

  const filteredExercises = exercises.filter((ex) => {
    const matchSearch =
      !pickerSearch ||
      (ex.nameIt ?? ex.name).toLowerCase().includes(pickerSearch.toLowerCase()) || ex.name.toLowerCase().includes(pickerSearch.toLowerCase());
    const matchMuscle = !pickerMuscle || ex.primaryMuscle.id === pickerMuscle;
    return matchSearch && matchMuscle;
  });

  function addExerciseToDay(ex: ExerciseWithRelations) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === activeDayIndex
          ? {
              ...d,
              exercises: [
                ...d.exercises,
                {
                  exerciseId: ex.id,
                  exerciseName: ex.nameIt ?? ex.name,
                  sets: 3,
                  reps: "10",
                  restSeconds: 90,
                },
              ],
            }
          : d
      )
    );
    setShowPicker(false);
  }

  function removeExerciseFromDay(dayIndex: number, exIndex: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIndex) }
          : d
      )
    );
  }

  function updateExercise(dayIndex: number, exIndex: number, field: keyof DayExercise, value: string | number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? {
              ...d,
              exercises: d.exercises.map((ex, j) =>
                j === exIndex ? { ...ex, [field]: value } : ex
              ),
            }
          : d
      )
    );
  }

  function addDay() {
    const newDay: ProgramDay = {
      name: `Giorno ${String.fromCharCode(65 + days.length)}`,
      dayNumber: days.length + 1,
      exercises: [],
    };
    setDays((prev) => [...prev, newDay]);
    setActiveDayIndex(days.length);
  }

  function removeDay(index: number) {
    if (days.length <= 1) return;
    setDays((prev) => prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, dayNumber: i + 1 })));
    setActiveDayIndex(Math.max(0, activeDayIndex - 1));
  }

  async function generate() {
    if (selectedMuscles.length === 0) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          muscleGroups: selectedMuscles,
          goal: genGoal,
          durationMinutes: genDuration,
          difficulty: genDifficulty,
          equipmentIds: [],
          equipmentPreference: genEquipmentPref,
        }),
      });
      const data = await res.json();
      const generated: ProgramDay = {
        name: selectedMuscles
          .map((m) => muscleGroups.find((mg) => mg.name === m)?.nameIt ?? m)
          .join(" + "),
        dayNumber: 1,
        exercises: data.exercises.map((e: { exercise: ExerciseWithRelations; sets: number; reps: string; restSeconds: number }) => ({
          exerciseId: e.exercise.id,
          exerciseName: e.exercise.nameIt ?? e.exercise.name,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.restSeconds,
        })),
      };
      setGeneratedDays([generated]);
    } finally {
      setGenerating(false);
    }
  }

  function updateGeneratedExercise(exIndex: number, field: keyof DayExercise, value: string | number) {
    setGeneratedDays((prev) =>
      prev.map((d, i) =>
        i === 0
          ? { ...d, exercises: d.exercises.map((ex, j) => j === exIndex ? { ...ex, [field]: value } : ex) }
          : d
      )
    );
  }

  function removeGeneratedExercise(exIndex: number) {
    setGeneratedDays((prev) =>
      prev.map((d, i) => i === 0 ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIndex) } : d)
    );
  }

  function useGeneratedDays() {
    setDays(generatedDays.map((d, i) => ({ ...d, dayNumber: i + 1 })));
    setMode("manual");
    setStep("days");
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          goal,
          days: days.map((day) => ({
            ...day,
            exercises: day.exercises.map((ex, order) => ({ ...ex, order })),
          })),
        }),
      });
      if (res.ok) {
        router.push("/programs");
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Errore durante il salvataggio");
      }
    } catch {
      setSaveError("Errore di rete, riprova");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-xl p-2 hover:bg-zinc-800 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Nuova Scheda</h1>
      </div>

      {/* Mode selector */}
      {step === "meta" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("manual")}
              className={`rounded-2xl border p-4 text-left transition-all ${mode === "manual" ? "border-orange-500 bg-orange-500/10" : "border-zinc-800 bg-zinc-900"}`}
            >
              <Dumbbell className={`h-6 w-6 mb-2 ${mode === "manual" ? "text-orange-400" : "text-zinc-400"}`} />
              <p className="font-semibold text-sm">Manuale</p>
              <p className="text-xs text-zinc-400 mt-1">Scegli esercizi dal database</p>
            </button>
            <button
              onClick={() => setMode("generate")}
              className={`rounded-2xl border p-4 text-left transition-all ${mode === "generate" ? "border-orange-500 bg-orange-500/10" : "border-zinc-800 bg-zinc-900"}`}
            >
              <Sparkles className={`h-6 w-6 mb-2 ${mode === "generate" ? "text-orange-400" : "text-zinc-400"}`} />
              <p className="font-semibold text-sm">Genera</p>
              <p className="text-xs text-zinc-400 mt-1">Scheda automatica per gruppo muscolare</p>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Nome scheda *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Push Pull Legs"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Descrizione</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Note sulla scheda..."
                rows={2}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-2 block">Obiettivo</label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${goal === g ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}
                  >
                    {getGoalLabel(g)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!name.trim()}
            onClick={() => {
              if (mode === "generate") {
                setGenGoal(goal);
                setStep("generate");
              } else {
                setStep("days");
              }
            }}
          >
            Continua
          </Button>
        </div>
      )}

      {/* Generate step */}
      {step === "generate" && mode === "generate" && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Gruppi muscolari da allenare</label>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((mg) => (
                <button
                  key={mg.id}
                  onClick={() =>
                    setSelectedMuscles((prev) =>
                      prev.includes(mg.name)
                        ? prev.filter((m) => m !== mg.name)
                        : [...prev, mg.name]
                    )
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedMuscles.includes(mg.name) ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {mg.nameIt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Obiettivo</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button key={g} onClick={() => setGenGoal(g)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${genGoal === g ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                  {getGoalLabel(g)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Livello</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button key={d} onClick={() => setGenDifficulty(d)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${genDifficulty === d ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                  {getDifficultyLabel(d)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Durata allenamento</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button key={d} onClick={() => setGenDuration(d)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${genDuration === d ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                  {d}min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Tipologia esercizi</label>
            <div className="flex gap-2">
              {([ { value: "any", label: "Tutto" }, { value: "bodyweight", label: "Corpo libero" }, { value: "equipment", label: "Attrezzatura" } ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setGenEquipmentPref(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${genEquipmentPref === value ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-2"
            disabled={selectedMuscles.length === 0 || generating}
            onClick={generate}
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "Generazione..." : "Genera scheda"}
          </Button>

          {generatedDays.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-zinc-300">Scheda generata:</p>
              {generatedDays[0].exercises.map((ex, i) => {
                const stepCls = "w-8 h-8 flex items-center justify-center text-zinc-300 text-sm font-medium active:bg-zinc-700 shrink-0 select-none transition-colors hover:bg-zinc-700";
                return (
                <Card key={i}>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm flex-1 min-w-0 truncate">{ex.exerciseName}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setReplaceIndex(i); setReplaceSearch(""); }}
                          className="rounded-lg p-1.5 text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                          title="Sostituisci esercizio"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeGeneratedExercise(i)} className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Serie */}
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Serie</label>
                        <div className="flex items-center rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                          <button type="button" className={stepCls} onClick={() => updateGeneratedExercise(i, "sets", Math.max(1, ex.sets - 1))}>−</button>
                          <input type="number" value={ex.sets}
                            onChange={(e) => updateGeneratedExercise(i, "sets", Math.max(1, parseInt(e.target.value) || 1))}
                            className="flex-1 min-w-0 bg-transparent text-sm text-center py-1.5 focus:outline-none text-zinc-100"
                            min={1} max={10} />
                          <button type="button" className={stepCls} onClick={() => updateGeneratedExercise(i, "sets", Math.min(10, ex.sets + 1))}>+</button>
                        </div>
                      </div>
                      {/* Reps (string like "12-15") */}
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Reps</label>
                        <input type="text" value={ex.reps}
                          onChange={(e) => updateGeneratedExercise(i, "reps", e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-center focus:outline-none focus:border-orange-500 text-zinc-100 h-8" />
                      </div>
                    </div>

                    {/* Recupero */}
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Recupero (s)</label>
                      <div className="flex items-center rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                        <button type="button" className={`${stepCls} px-3 text-xs`} onClick={() => updateGeneratedExercise(i, "restSeconds", Math.max(0, ex.restSeconds - 15))}>−15</button>
                        <input type="number" value={ex.restSeconds}
                          onChange={(e) => updateGeneratedExercise(i, "restSeconds", Math.max(0, parseInt(e.target.value) || 0))}
                          className="flex-1 min-w-0 bg-transparent text-sm text-center py-1.5 focus:outline-none text-zinc-100"
                          step={15} />
                        <button type="button" className={`${stepCls} px-3 text-xs`} onClick={() => updateGeneratedExercise(i, "restSeconds", ex.restSeconds + 15)}>+15</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
              <Button className="w-full" onClick={useGeneratedDays} disabled={generatedDays[0].exercises.length === 0}>
                Usa questa scheda
              </Button>
            </div>
          )}

          {/* Replace exercise picker */}
          {replaceIndex !== null && (() => {
            const currentExId = generatedDays[0]?.exercises[replaceIndex]?.exerciseId;
            const currentEx = exercises.find((e) => e.id === currentExId);
            const muscleId = currentEx?.primaryMuscle?.id;
            const filtered = exercises.filter((e) =>
              e.primaryMuscle?.id === muscleId &&
              (!replaceSearch || (e.nameIt ?? e.name).toLowerCase().includes(replaceSearch.toLowerCase()))
            );
            return (
              <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col justify-end">
                <div className="bg-zinc-950 rounded-t-2xl flex flex-col" style={{ height: "85svh" }}>
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="font-semibold">Sostituisci esercizio</h3>
                      {currentEx && <p className="text-xs text-zinc-500 mt-0.5">{currentEx.primaryMuscle.nameIt}</p>}
                    </div>
                    <button onClick={() => setReplaceIndex(null)}>
                      <X className="h-5 w-5 text-zinc-400" />
                    </button>
                  </div>
                  <div className="p-4 shrink-0">
                    <input type="search" placeholder="Cerca..." value={replaceSearch}
                      onChange={(e) => setReplaceSearch(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                      autoFocus />
                  </div>
                  <div className="overflow-y-auto flex-1 px-4 pb-10 space-y-2">
                    {filtered.map((e) => (
                      <button key={e.id}
                        onClick={() => {
                          setGeneratedDays((prev) => prev.map((d, di) => di === 0
                            ? { ...d, exercises: d.exercises.map((ex, j) => j === replaceIndex
                                ? { ...ex, exerciseId: e.id, exerciseName: e.nameIt ?? e.name }
                                : ex) }
                            : d));
                          setReplaceIndex(null);
                        }}
                        className={`w-full text-left rounded-xl border p-3 transition-colors ${
                          e.id === currentExId
                            ? "border-orange-500/50 bg-orange-500/5"
                            : "border-zinc-800 bg-zinc-900 hover:border-orange-500/50 active:bg-zinc-800"
                        }`}
                      >
                        <p className="font-medium text-sm">{e.nameIt ?? e.name}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">{e.primaryMuscle.nameIt} · {getDifficultyLabel(e.difficulty)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          <Button variant="ghost" className="w-full" onClick={() => setStep("meta")}>
            Indietro
          </Button>
        </div>
      )}

      {/* Days builder */}
      {step === "days" && (
        <div className="space-y-4">
          {/* Day tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {days.map((day, i) => (
              <button
                key={i}
                onClick={() => setActiveDayIndex(i)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${activeDayIndex === i ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}
              >
                {day.name}
              </button>
            ))}
            <button
              onClick={addDay}
              className="shrink-0 rounded-xl border border-dashed border-zinc-700 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Active day */}
          {days[activeDayIndex] && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={days[activeDayIndex].name}
                  onChange={(e) =>
                    setDays((prev) =>
                      prev.map((d, i) => i === activeDayIndex ? { ...d, name: e.target.value } : d)
                    )
                  }
                  className="text-base font-semibold bg-transparent border-none focus:outline-none text-zinc-100"
                />
                {days.length > 1 && (
                  <button onClick={() => removeDay(activeDayIndex)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {days[activeDayIndex].exercises.map((ex, exI) => {
                const stepCls = "w-8 h-8 flex items-center justify-center text-zinc-300 text-sm font-medium active:bg-zinc-700 shrink-0 select-none transition-colors hover:bg-zinc-700";
                return (
                <Card key={exI}>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <GripVertical className="h-4 w-4 text-zinc-600 shrink-0" />
                        <p className="font-medium text-sm truncate">{ex.exerciseName}</p>
                        <button
                          onClick={() => setInfoExercise(exercises.find((e) => e.id === ex.exerciseId) ?? null)}
                          className="text-zinc-500 hover:text-orange-400 transition-colors shrink-0"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeExerciseFromDay(activeDayIndex, exI)} className="shrink-0">
                        <X className="h-4 w-4 text-zinc-500 hover:text-red-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Serie */}
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Serie</label>
                        <div className="flex items-center rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                          <button type="button" className={stepCls} onClick={() => updateExercise(activeDayIndex, exI, "sets", Math.max(1, ex.sets - 1))}>−</button>
                          <input type="number" value={ex.sets}
                            onChange={(e) => updateExercise(activeDayIndex, exI, "sets", Math.max(1, parseInt(e.target.value) || 1))}
                            className="flex-1 min-w-0 bg-transparent text-sm text-center py-1.5 focus:outline-none text-zinc-100"
                            min={1} max={10} />
                          <button type="button" className={stepCls} onClick={() => updateExercise(activeDayIndex, exI, "sets", Math.min(10, ex.sets + 1))}>+</button>
                        </div>
                      </div>
                      {/* Reps */}
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Reps</label>
                        <input type="text" value={ex.reps}
                          onChange={(e) => updateExercise(activeDayIndex, exI, "reps", e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-center focus:outline-none focus:border-orange-500 text-zinc-100 h-8" />
                      </div>
                    </div>

                    {/* Recupero */}
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Recupero (s)</label>
                      <div className="flex items-center rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                        <button type="button" className={`${stepCls} px-3 text-xs`} onClick={() => updateExercise(activeDayIndex, exI, "restSeconds", Math.max(0, ex.restSeconds - 15))}>−15</button>
                        <input type="number" value={ex.restSeconds}
                          onChange={(e) => updateExercise(activeDayIndex, exI, "restSeconds", Math.max(0, parseInt(e.target.value) || 0))}
                          className="flex-1 min-w-0 bg-transparent text-sm text-center py-1.5 focus:outline-none text-zinc-100"
                          step={15} />
                        <button type="button" className={`${stepCls} px-3 text-xs`} onClick={() => updateExercise(activeDayIndex, exI, "restSeconds", ex.restSeconds + 15)}>+15</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Peso target (kg)</label>
                      <input
                        type="number"
                        value={ex.weight ?? ""}
                        onChange={(e) => updateExercise(activeDayIndex, exI, "weight", parseFloat(e.target.value))}
                        placeholder="—"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm focus:outline-none focus:border-orange-500"
                        step={2.5}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Note personali</label>
                      <textarea
                        value={ex.notes ?? ""}
                        onChange={(e) => updateExercise(activeDayIndex, exI, "notes", e.target.value)}
                        placeholder="Es. grip neutro, focus sul picco..."
                        rows={2}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

              <Button variant="outline" className="w-full gap-2" onClick={() => setShowPicker(true)}>
                <Plus className="h-4 w-4" />
                Aggiungi esercizio
              </Button>
            </div>
          )}

          <div className="pt-2 space-y-2">
            {saveError && (
              <p className="text-sm text-red-400 text-center">{saveError}</p>
            )}
            <Button className="w-full" onClick={save} disabled={saving || !name.trim()}>
              {saving ? "Salvataggio..." : "Salva scheda"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("meta")}>
              Indietro
            </Button>
          </div>
        </div>
      )}

      <ExerciseInfoSheet exercise={infoExercise} onClose={() => setInfoExercise(null)} />

      {/* Exercise picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col justify-end">
          <div className="bg-zinc-950 rounded-t-2xl flex flex-col" style={{ height: "85svh" }}>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold">Scegli esercizio</h3>
              <button onClick={() => setShowPicker(false)}>
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input
                type="search"
                placeholder="Cerca..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                autoFocus
              />
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button onClick={() => setPickerMuscle("")}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${!pickerMuscle ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                  Tutti
                </button>
                {muscleGroups.map((mg) => (
                  <button key={mg.id} onClick={() => setPickerMuscle(mg.id === pickerMuscle ? "" : mg.id)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${pickerMuscle === mg.id ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                    {mg.nameIt}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-10 space-y-2">
              {filteredExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 hover:border-orange-500/50 transition-colors"
                >
                  <button
                    onClick={() => addExerciseToDay(ex)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="font-medium text-sm">{ex.nameIt ?? ex.name}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">{ex.primaryMuscle.nameIt}</p>
                  </button>
                  <button
                    onClick={() => setInfoExercise(ex)}
                    className="text-zinc-500 hover:text-orange-400 transition-colors shrink-0 p-1"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
