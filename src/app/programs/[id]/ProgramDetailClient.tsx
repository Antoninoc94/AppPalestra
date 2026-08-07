"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Calendar,
  Trash2,
  Play,
  ToggleLeft,
  ToggleRight,
  Pencil,
  X,
  Check,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { getGoalLabel, formatShortDate, formatDuration, formatWeight } from "@/lib/utils";

type MuscleGroup = { id: string; name: string; nameIt: string };

type Exercise = {
  id: string;
  name: string;
  nameIt: string | null;
  primaryMuscle: MuscleGroup;
};

type ProgramExercise = {
  id: string;
  order: number;
  sets: number;
  reps: string;
  restSeconds: number;
  weight: number | null;
  notes: string | null;
  exercise: Exercise;
};

type ProgramDay = {
  id: string;
  name: string;
  dayNumber: number;
  weekDays: number[];
  exercises: ProgramExercise[];
};

type Session = {
  id: string;
  date: Date | string;
  duration: number | null;
  programDay: { name: string } | null;
  _count: { sets: number };
};

type Program = {
  id: string;
  name: string;
  description: string | null;
  goal: string;
  isActive: boolean;
  days: ProgramDay[];
  sessions: Session[];
  _count: { sessions: number };
  createdAt: Date | string;
};

const WEEK_DAYS = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mer", value: 3 },
  { label: "Gio", value: 4 },
  { label: "Ven", value: 5 },
  { label: "Sab", value: 6 },
  { label: "Dom", value: 0 },
];

const stepCls =
  "w-8 h-8 flex items-center justify-center text-zinc-300 text-sm font-medium active:bg-zinc-700 shrink-0 select-none transition-colors hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed";

export function ProgramDetailClient({
  program: initial,
  allExercises,
}: {
  program: Program;
  allExercises: Exercise[];
}) {
  const router = useRouter();
  const [program, setProgram] = useState(initial);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set([initial.days[0]?.id]));
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dayWeekDays, setDayWeekDays] = useState<Record<string, number[]>>(
    Object.fromEntries(initial.days.map((d) => [d.id, d.weekDays ?? []]))
  );

  // Edit mode state
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");

  function toggleDay(dayId: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  }

  async function toggleActive() {
    setLoading(true);
    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !program.isActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProgram((p) => ({ ...p, isActive: updated.isActive ?? !p.isActive }));
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleWeekDay(dayId: string, dow: number) {
    const current = dayWeekDays[dayId] ?? [];
    const updated = current.includes(dow)
      ? current.filter((d) => d !== dow)
      : [...current, dow];
    setDayWeekDays((prev) => ({ ...prev, [dayId]: updated }));
    await fetch(`/api/programs/${program.id}/days/${dayId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekDays: updated }),
    });
  }

  async function deleteProgram() {
    setLoading(true);
    try {
      const res = await fetch(`/api/programs/${program.id}`, { method: "DELETE" });
      if (res.ok) router.push("/programs");
    } finally {
      setLoading(false);
    }
  }

  // Exercise editing helpers
  function updateExerciseLocal(dayId: string, peId: string, patch: Partial<ProgramExercise>) {
    setProgram((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id !== dayId
          ? d
          : { ...d, exercises: d.exercises.map((e) => (e.id !== peId ? e : { ...e, ...patch })) }
      ),
    }));
  }

  async function patchExercise(dayId: string, peId: string, data: Record<string, unknown>) {
    updateExerciseLocal(dayId, peId, data as Partial<ProgramExercise>);
    await fetch(`/api/programs/${program.id}/days/${dayId}/exercises/${peId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function removeExercise(dayId: string, peId: string) {
    setProgram((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id !== dayId ? d : { ...d, exercises: d.exercises.filter((e) => e.id !== peId) }
      ),
    }));
    await fetch(`/api/programs/${program.id}/days/${dayId}/exercises/${peId}`, {
      method: "DELETE",
    });
  }

  async function moveExercise(dayId: string, peId: string, direction: -1 | 1) {
    const day = program.days.find((d) => d.id === dayId);
    if (!day) return;
    const exs = [...day.exercises];
    const idx = exs.findIndex((e) => e.id === peId);
    const target = idx + direction;
    if (target < 0 || target >= exs.length) return;
    [exs[idx], exs[target]] = [exs[target], exs[idx]];
    setProgram((p) => ({
      ...p,
      days: p.days.map((d) => (d.id !== dayId ? d : { ...d, exercises: exs })),
    }));
    // persist both orders
    await Promise.all([
      fetch(`/api/programs/${program.id}/days/${dayId}/exercises/${exs[idx].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: idx }),
      }),
      fetch(`/api/programs/${program.id}/days/${dayId}/exercises/${exs[target].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: target }),
      }),
    ]);
  }

  async function addExercise(dayId: string, exercise: Exercise) {
    const res = await fetch(`/api/programs/${program.id}/days/${dayId}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId: exercise.id }),
    });
    if (res.ok) {
      const pe: ProgramExercise = await res.json();
      setProgram((p) => ({
        ...p,
        days: p.days.map((d) =>
          d.id !== dayId ? d : { ...d, exercises: [...d.exercises, pe] }
        ),
      }));
    }
    setPickerDayId(null);
    setPickerSearch("");
  }

  const filteredExercises = allExercises.filter((e) => {
    const q = pickerSearch.toLowerCase();
    return (
      !q ||
      e.name.toLowerCase().includes(q) ||
      (e.nameIt ?? "").toLowerCase().includes(q) ||
      e.primaryMuscle.nameIt.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/programs">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{program.name}</h1>
        </div>
      </div>

      {/* Meta */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant={program.isActive ? "success" : "secondary"}>
              {program.isActive ? "Attiva" : "Inattiva"}
            </Badge>
            <Badge variant="outline">{getGoalLabel(program.goal)}</Badge>
            <Badge variant="outline">{program.days.length} giorni</Badge>
            <Badge variant="outline">{program._count.sessions} sessioni</Badge>
          </div>
          {program.description && (
            <p className="text-zinc-400 text-sm">{program.description}</p>
          )}
          <p className="text-zinc-500 text-xs">Creata il {formatShortDate(program.createdAt)}</p>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Link href="/workout" className="flex-1">
              <Button className="w-full gap-2" size="sm">
                <Play className="h-4 w-4" />
                Inizia allenamento
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleActive}
              disabled={loading}
              className="gap-2"
            >
              {program.isActive ? (
                <ToggleRight className="h-4 w-4 text-green-400" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-zinc-500" />
              )}
              {program.isActive ? "Disattiva" : "Attiva"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Days */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-300">Giorni di allenamento</h2>
        {program.days.map((day) => {
          const isOpen = expandedDays.has(day.id);
          const isEditing = editingDayId === day.id;

          return (
            <Card key={day.id}>
              <button
                className="w-full text-left"
                onClick={() => toggleDay(day.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{day.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {day.exercises.length} esercizi
                      </p>
                      {/* Weekday chips */}
                      <div
                        className="flex gap-1 mt-2 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {WEEK_DAYS.map(({ label, value }) => {
                          const active = (dayWeekDays[day.id] ?? []).includes(value);
                          return (
                            <button
                              key={value}
                              onClick={() => toggleWeekDay(day.id, value)}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                                active
                                  ? "bg-orange-500 text-white"
                                  : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0 ml-3" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0 ml-3" />
                    )}
                  </div>
                </CardContent>
              </button>

              {isOpen && (
                <div className="border-t border-zinc-800">
                  {/* Edit toggle */}
                  <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-800/60">
                    <span className="text-xs text-zinc-500">
                      {isEditing ? "Modalità modifica" : ""}
                    </span>
                    <button
                      onClick={() => setEditingDayId(isEditing ? null : day.id)}
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                        isEditing
                          ? "bg-orange-500/20 text-orange-400"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Fine
                        </>
                      ) : (
                        <>
                          <Pencil className="h-3.5 w-3.5" /> Modifica
                        </>
                      )}
                    </button>
                  </div>

                  {/* Exercise list */}
                  {day.exercises.map((pe, idx) =>
                    isEditing ? (
                      /* ── Edit row ── */
                      <div key={pe.id} className={`px-3 py-3 space-y-2 ${idx < day.exercises.length - 1 ? "border-b border-zinc-800/60" : ""}`}>
                        <div className="flex items-center gap-2">
                          {/* Reorder */}
                          <div className="flex flex-col shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveExercise(day.id, pe.id, -1)}
                              className="text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === day.exercises.length - 1}
                              onClick={() => moveExercise(day.id, pe.id, 1)}
                              className="text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {pe.exercise.nameIt ?? pe.exercise.name}
                            </p>
                            <p className="text-zinc-500 text-xs">{pe.exercise.primaryMuscle.nameIt}</p>
                          </div>
                          <button onClick={() => removeExercise(day.id, pe.id)} className="shrink-0">
                            <X className="h-4 w-4 text-zinc-500 hover:text-red-400" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pl-7">
                          {/* Serie */}
                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Serie</label>
                            <div className="flex items-center rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                              <button
                                type="button"
                                className={stepCls}
                                onClick={() => patchExercise(day.id, pe.id, { sets: Math.max(1, pe.sets - 1) })}
                              >−</button>
                              <input
                                type="number"
                                value={pe.sets}
                                onChange={(e) => patchExercise(day.id, pe.id, { sets: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="flex-1 min-w-0 bg-transparent text-sm text-center py-1.5 focus:outline-none text-zinc-100 w-0"
                                min={1} max={10}
                              />
                              <button
                                type="button"
                                className={stepCls}
                                onClick={() => patchExercise(day.id, pe.id, { sets: Math.min(10, pe.sets + 1) })}
                              >+</button>
                            </div>
                          </div>
                          {/* Reps */}
                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Reps</label>
                            <input
                              type="text"
                              value={pe.reps}
                              onChange={(e) => patchExercise(day.id, pe.id, { reps: e.target.value })}
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-center focus:outline-none focus:border-orange-500 text-zinc-100 h-8"
                            />
                          </div>
                        </div>

                        <div className="pl-7">
                          <label className="text-[10px] text-zinc-500 block mb-1">Recupero (s)</label>
                          <div className="flex items-center rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                            <button
                              type="button"
                              className={`${stepCls} px-3 text-xs`}
                              onClick={() => patchExercise(day.id, pe.id, { restSeconds: Math.max(0, pe.restSeconds - 15) })}
                            >−15</button>
                            <input
                              type="number"
                              value={pe.restSeconds}
                              onChange={(e) => patchExercise(day.id, pe.id, { restSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="flex-1 min-w-0 bg-transparent text-sm text-center py-1.5 focus:outline-none text-zinc-100 w-0"
                              step={15}
                            />
                            <button
                              type="button"
                              className={`${stepCls} px-3 text-xs`}
                              onClick={() => patchExercise(day.id, pe.id, { restSeconds: pe.restSeconds + 15 })}
                            >+15</button>
                          </div>
                        </div>

                        <div className="pl-7">
                          <label className="text-[10px] text-zinc-500 block mb-1">Peso target (kg)</label>
                          <input
                            type="number"
                            value={pe.weight ?? ""}
                            onChange={(e) => patchExercise(day.id, pe.id, { weight: e.target.value ? parseFloat(e.target.value) : null })}
                            placeholder="—"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm focus:outline-none focus:border-orange-500 text-zinc-100"
                            step={2.5}
                          />
                        </div>
                      </div>
                    ) : (
                      /* ── View row ── */
                      <div
                        key={pe.id}
                        className={`px-4 py-3 ${idx < day.exercises.length - 1 ? "border-b border-zinc-800/60" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {pe.exercise.nameIt ?? pe.exercise.name}
                            </p>
                            <p className="text-zinc-500 text-xs mt-0.5">
                              {pe.exercise.primaryMuscle.nameIt}
                            </p>
                          </div>
                          <div className="text-right shrink-0 text-xs text-zinc-400 space-y-0.5">
                            <p className="font-medium text-white">
                              {pe.sets} × {pe.reps}
                            </p>
                            {pe.weight && <p>{formatWeight(pe.weight)}</p>}
                            <p className="text-zinc-500">{pe.restSeconds}s riposo</p>
                          </div>
                        </div>
                        {pe.notes && (
                          <p className="text-zinc-500 text-xs mt-1 italic">{pe.notes}</p>
                        )}
                      </div>
                    )
                  )}

                  {/* Add exercise button (edit mode only) */}
                  {isEditing && (
                    <div className="px-4 py-3 border-t border-zinc-800/60">
                      <button
                        onClick={() => { setPickerDayId(day.id); setPickerSearch(""); }}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-zinc-500 text-sm hover:border-orange-500/40 hover:text-zinc-300 transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        Aggiungi esercizio
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Recent sessions */}
      {program.sessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-300">Sessioni recenti</h2>
          <div className="space-y-2">
            {program.sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-orange-500/10 p-2">
                        <Dumbbell className="h-4 w-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {session.programDay?.name ?? "Allenamento libero"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatShortDate(session.date)}
                          </span>
                          {session.duration && (
                            <span>{formatDuration(session.duration)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{session._count.sets} serie</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Delete */}
      <div className="pt-2">
        {showDeleteConfirm ? (
          <Card className="border-red-900/50">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-zinc-300">
                Eliminare questa scheda? L&apos;azione non è reversibile.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteProgram}
                  disabled={loading}
                  className="flex-1"
                >
                  Elimina
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Annulla
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            Elimina scheda
          </Button>
        )}
      </div>

      {/* Exercise Picker bottom sheet */}
      {pickerDayId && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPickerDayId(null)} />
          <div className="relative bg-zinc-900 rounded-t-3xl border-t border-zinc-800 flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <h3 className="font-semibold text-base">Aggiungi esercizio</h3>
              <button onClick={() => setPickerDayId(null)}>
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            <div className="px-4 pb-3 shrink-0">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2">
                <Search className="h-4 w-4 text-zinc-500 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Cerca esercizio..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-8">
              {filteredExercises.slice(0, 60).map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExercise(pickerDayId, ex)}
                  className="w-full flex items-center gap-3 py-3 border-b border-zinc-800/60 last:border-0 text-left hover:bg-zinc-800/50 -mx-1 px-1 rounded-lg transition-colors"
                >
                  <div className="rounded-lg bg-zinc-800 p-1.5 shrink-0">
                    <Dumbbell className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ex.nameIt ?? ex.name}</p>
                    <p className="text-xs text-zinc-500">{ex.primaryMuscle.nameIt}</p>
                  </div>
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-8">Nessun esercizio trovato</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
