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
} from "lucide-react";
import Link from "next/link";
import { getGoalLabel, formatShortDate, formatDuration, formatWeight } from "@/lib/utils";

type Exercise = {
  id: string;
  name: string;
  nameIt: string | null;
  primaryMuscle: { nameIt: string };
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

export function ProgramDetailClient({ program: initial }: { program: Program }) {
  const router = useRouter();
  const [program, setProgram] = useState(initial);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set([initial.days[0]?.id]));
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dayWeekDays, setDayWeekDays] = useState<Record<string, number[]>>(
    Object.fromEntries(initial.days.map((d) => [d.id, d.weekDays ?? []]))
  );

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
                  {day.exercises.map((pe, idx) => (
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
                          {pe.weight && (
                            <p>{formatWeight(pe.weight)}</p>
                          )}
                          <p className="text-zinc-500">
                            {pe.restSeconds}s riposo
                          </p>
                        </div>
                      </div>
                      {pe.notes && (
                        <p className="text-zinc-500 text-xs mt-1 italic">{pe.notes}</p>
                      )}
                    </div>
                  ))}
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
    </div>
  );
}
