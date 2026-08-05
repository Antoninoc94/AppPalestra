"use client";

import { X, Dumbbell, Target, Zap, Info } from "lucide-react";
import { getDifficultyLabel } from "@/lib/utils";
import type { ExerciseWithRelations } from "@/types";

interface Props {
  exercise: ExerciseWithRelations | null;
  onClose: () => void;
}

const difficultyColor: Record<string, string> = {
  beginner: "text-green-400 bg-green-500/10",
  intermediate: "text-yellow-400 bg-yellow-500/10",
  advanced: "text-red-400 bg-red-500/10",
};

export function ExerciseInfoSheet({ exercise, onClose }: Props) {
  if (!exercise) return null;

  const steps = exercise.description
    ? exercise.description.split(/\n|\s*\|\s*/).filter(Boolean)
    : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-zinc-900 border-t border-zinc-800">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-4 border-b border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-orange-500/15 p-2.5 shrink-0 mt-0.5">
              <Dumbbell className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">
                {exercise.nameIt ?? exercise.name}
              </h2>
              {exercise.nameIt && exercise.nameIt !== exercise.name && (
                <p className="text-zinc-500 text-xs mt-0.5">{exercise.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-zinc-800 text-zinc-500 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Chips: muscolo + difficoltà */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200">
              <Target className="h-3.5 w-3.5 text-orange-400" />
              {exercise.primaryMuscle.nameIt}
            </span>
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${difficultyColor[exercise.difficulty] ?? "text-zinc-400 bg-zinc-800"}`}
            >
              <Zap className="h-3.5 w-3.5" />
              {getDifficultyLabel(exercise.difficulty)}
            </span>
            {exercise.equipment.length > 0 &&
              exercise.equipment.map((eq) => (
                <span
                  key={eq.equipment.id}
                  className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300"
                >
                  {eq.equipment.nameIt}
                </span>
              ))}
          </div>

          {/* Muscoli secondari */}
          {(exercise.secondaryMuscles ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Muscoli secondari
              </p>
              <p className="text-sm text-zinc-300">
                {(exercise.secondaryMuscles ?? []).join(", ")}
              </p>
            </div>
          )}

          {/* Istruzioni */}
          {steps.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Come si esegue
              </p>
              <ol className="space-y-3">
                {steps.map((step, i) => {
                  const text = step.replace(/^\d+\.\s*/, "");
                  return (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                        {i + 1}
                      </span>
                      <p className="text-sm text-zinc-300 leading-relaxed pt-0.5">{text}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-zinc-800/50 p-4 text-zinc-500 text-sm">
              <Info className="h-4 w-4 shrink-0" />
              Nessuna descrizione disponibile per questo esercizio.
            </div>
          )}
        </div>

        {/* Bottom padding for safe area */}
        <div className="pb-8" />
      </div>
    </>
  );
}
