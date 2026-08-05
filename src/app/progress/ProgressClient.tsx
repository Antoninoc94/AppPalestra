"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart2, TrendingUp, Calendar, Trophy, Dumbbell, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Exercise {
  id: string;
  name: string;
  nameIt: string | null;
  bestWeight: number | null;
}

interface Session {
  id: string;
  date: Date;
  duration: number | null;
  _count: { sets: number };
  programDay: { name: string } | null;
}

interface Stats {
  totalSessions: number;
  sessionsThisMonth: number;
  totalSets: number;
}

interface Props {
  exercises: Exercise[];
  recentSessions: Session[];
  stats: Stats;
}

interface ProgressPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
}

export function ProgressClient({ exercises, recentSessions, stats }: Props) {
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [progressData, setProgressData] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showChart, setShowChart] = useState(false);

  const fetchProgress = useCallback(async (exerciseId: string) => {
    setLoading(true);
    const res = await fetch(`/api/progress?exerciseId=${exerciseId}`);
    const data = await res.json();
    setProgressData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedExercise) fetchProgress(selectedExercise);
  }, [selectedExercise, fetchProgress]);

  const filteredExercises = exercises.filter(
    (ex) =>
      !search ||
      (ex.nameIt ?? ex.name).toLowerCase().includes(search.toLowerCase()) ||
      ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedEx = exercises.find((e) => e.id === selectedExercise);

  const topPRs = exercises
    .filter((ex) => ex.bestWeight != null && ex.bestWeight > 0)
    .sort((a, b) => (b.bestWeight ?? 0) - (a.bestWeight ?? 0))
    .slice(0, 6);

  const handleSelectExercise = (id: string) => {
    setSelectedExercise(id);
    setShowChart(true);
  };

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <h1 className="text-xl font-bold">Progressi</h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.sessionsThisMonth}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Questo mese</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.totalSessions}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Totale sessioni</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.totalSets}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Serie totali</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state: no workouts yet */}
      {stats.totalSessions === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Nessun allenamento ancora</p>
          <p className="text-xs mt-1 text-zinc-600">
            Completa il tuo primo allenamento per vedere i progressi qui
          </p>
        </div>
      )}

      {/* Personal records */}
      {topPRs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Record personali
          </h2>
          <div className="space-y-2">
            {topPRs.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleSelectExercise(ex.id)}
                className="w-full"
              >
                <Card className={`transition-colors ${selectedExercise === ex.id ? "border-orange-500/50 bg-orange-500/5" : ""}`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-sm font-medium">{ex.nameIt ?? ex.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-orange-400 bg-orange-500/10 border-orange-500/20">
                        {ex.bestWeight} kg
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise chart */}
      {exercises.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progressione per esercizio
          </h2>
          <input
            type="search"
            placeholder="Cerca esercizio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
          />
          {filteredExercises.length === 0 && search && (
            <p className="text-sm text-zinc-500 text-center py-2">Nessun esercizio trovato</p>
          )}
          {filteredExercises.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleSelectExercise(ex.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedExercise === ex.id
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {ex.nameIt ?? ex.name}
                </button>
              ))}
            </div>
          )}

          {/* Empty state for exercise selector */}
          {!selectedExercise && (
            <div className="text-center py-8 text-zinc-500">
              <TrendingUp className="h-7 w-7 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Seleziona un esercizio per vedere il grafico</p>
            </div>
          )}

          {/* Chart */}
          {selectedExercise && showChart && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{selectedEx?.nameIt ?? selectedEx?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
                    Caricamento...
                  </div>
                ) : progressData.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
                    Nessun dato con peso per questo esercizio
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs text-zinc-400 mb-2">Peso massimo (kg)</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={progressData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
                          <YAxis tick={{ fill: "#71717a", fontSize: 10 }} width={30} />
                          <Tooltip
                            contentStyle={{
                              background: "#18181b",
                              border: "1px solid #27272a",
                              borderRadius: 8,
                              color: "#f4f4f5",
                            }}
                            labelStyle={{ color: "#a1a1aa" }}
                            formatter={(value) => [`${value} kg`, "Peso max"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="maxWeight"
                            stroke="#f97316"
                            strokeWidth={2}
                            dot={{ fill: "#f97316", r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-400 mb-2">Volume totale (kg × reps)</p>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={progressData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
                          <YAxis tick={{ fill: "#71717a", fontSize: 10 }} width={40} />
                          <Tooltip
                            contentStyle={{
                              background: "#18181b",
                              border: "1px solid #27272a",
                              borderRadius: 8,
                              color: "#f4f4f5",
                            }}
                            labelStyle={{ color: "#a1a1aa" }}
                            formatter={(value) => [`${value}`, "Volume"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="totalVolume"
                            stroke="#818cf8"
                            strokeWidth={2}
                            dot={{ fill: "#818cf8", r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent sessions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Sessioni recenti
        </h2>
        {recentSessions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nessuna sessione ancora</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {session.programDay?.name ?? "Allenamento libero"}
                    </p>
                    <p className="text-zinc-400 text-xs mt-0.5">{formatDate(session.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary">{session._count.sets} serie</Badge>
                    {session.duration && (
                      <span className="text-xs text-zinc-500">
                        {Math.round(session.duration / 60)} min
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
