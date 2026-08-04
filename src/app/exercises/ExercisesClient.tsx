"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Dumbbell, ChevronDown } from "lucide-react";
import { getDifficultyLabel } from "@/lib/utils";
import type { ExerciseWithRelations } from "@/types";

interface Props {
  muscleGroups: { id: string; name: string; nameIt: string }[];
  equipment: { id: string; name: string; nameIt: string }[];
}

export function ExercisesClient({ muscleGroups, equipment }: Props) {
  const [exercises, setExercises] = useState<ExerciseWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchExercises = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "20",
      ...(search && { search }),
      ...(selectedMuscle && { muscle: selectedMuscle }),
      ...(selectedDifficulty && { difficulty: selectedDifficulty }),
    });
    const res = await fetch(`/api/exercises?${params}`);
    const data = await res.json();
    setExercises(reset ? data.exercises : (prev) => [...prev, ...data.exercises]);
    setTotal(data.total);
    if (!reset) setPage((p) => p + 1);
    setLoading(false);
  }, [page, search, selectedMuscle, selectedDifficulty]);

  useEffect(() => {
    setPage(1);
    fetchExercises(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedMuscle, selectedDifficulty]);

  const difficultyVariant = (d: string) => {
    if (d === "beginner") return "success";
    if (d === "advanced") return "destructive";
    return "secondary";
  };

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Libreria Esercizi</h1>
        <span className="text-zinc-400 text-sm">{total} esercizi</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="search"
          placeholder="Cerca esercizio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Filters toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="gap-2"
      >
        <Filter className="h-4 w-4" />
        Filtri
        <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
      </Button>

      {showFilters && (
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-2">Gruppo muscolare</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMuscle("")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!selectedMuscle ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}
              >
                Tutti
              </button>
              {muscleGroups.map((mg) => (
                <button
                  key={mg.id}
                  onClick={() => setSelectedMuscle(selectedMuscle === mg.id ? "" : mg.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedMuscle === mg.id ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}
                >
                  {mg.nameIt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-2">Difficoltà</p>
            <div className="flex gap-2">
              {["", "beginner", "intermediate", "advanced"].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedDifficulty === d ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"}`}
                >
                  {d === "" ? "Tutti" : getDifficultyLabel(d)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-2">
        {exercises.map((ex) => (
          <Card key={ex.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="rounded-lg bg-orange-500/10 p-2 shrink-0">
                    <Dumbbell className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm leading-tight">
                      {ex.nameIt ?? ex.name}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">{ex.name}</p>
                    <p className="text-zinc-400 text-xs mt-1">{ex.primaryMuscle.nameIt}</p>
                  </div>
                </div>
                <Badge variant={difficultyVariant(ex.difficulty) as "success" | "destructive" | "secondary"} className="shrink-0">
                  {getDifficultyLabel(ex.difficulty)}
                </Badge>
              </div>
              {ex.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {ex.equipment.map((eq) => (
                    <Badge key={eq.equipment.id} variant="outline" className="text-[10px]">
                      {eq.equipment.nameIt}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load more */}
      {exercises.length < total && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchExercises()}
          disabled={loading}
        >
          {loading ? "Caricamento..." : `Carica altri (${total - exercises.length})`}
        </Button>
      )}

      {!loading && exercises.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nessun esercizio trovato</p>
        </div>
      )}
    </div>
  );
}
