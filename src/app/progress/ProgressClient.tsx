"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart2, TrendingUp, Calendar, Trophy, Dumbbell, ChevronRight, Trash2, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

  const [sessions, setSessions] = useState<Session[]>(recentSessions);
  const [localStats, setLocalStats] = useState(stats);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [finalConfirmId, setFinalConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function deleteSession(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        const removed = sessions.find((s) => s.id === id);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setLocalStats((prev) => ({
          ...prev,
          totalSessions: Math.max(0, prev.totalSessions - 1),
          totalSets: removed ? Math.max(0, prev.totalSets - removed._count.sets) : prev.totalSets,
          sessionsThisMonth: isThisMonth(removed?.date)
            ? Math.max(0, prev.sessionsThisMonth - 1)
            : prev.sessionsThisMonth,
        }));
      }
    } finally {
      setDeleting(false);
      setFinalConfirmId(null);
      setConfirmDeleteId(null);
    }
  }

  function isThisMonth(date?: Date | string) {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  const sessionToDelete = sessions.find((s) => s.id === (finalConfirmId ?? confirmDeleteId));

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <h1 className="text-xl font-bold">Progressi</h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{localStats.sessionsThisMonth}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Questo mese</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{localStats.totalSessions}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Totale sessioni</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{localStats.totalSets}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Serie totali</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {localStats.totalSessions === 0 && (
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
              <button key={ex.id} onClick={() => handleSelectExercise(ex.id)} className="w-full">
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
                    selectedExercise === ex.id ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {ex.nameIt ?? ex.name}
                </button>
              ))}
            </div>
          )}

          {!selectedExercise && (
            <div className="text-center py-8 text-zinc-500">
              <TrendingUp className="h-7 w-7 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Seleziona un esercizio per vedere il grafico</p>
            </div>
          )}

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
                            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
                            labelStyle={{ color: "#a1a1aa" }}
                            formatter={(value) => [`${value} kg`, "Peso max"]}
                          />
                          <Line type="monotone" dataKey="maxWeight" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 3 }} activeDot={{ r: 5 }} />
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
                            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
                            labelStyle={{ color: "#a1a1aa" }}
                            formatter={(value) => [`${value}`, "Volume"]}
                          />
                          <Line type="monotone" dataKey="totalVolume" stroke="#818cf8" strokeWidth={2} dot={{ fill: "#818cf8", r: 3 }} activeDot={{ r: 5 }} />
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
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nessuna sessione ancora</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {session.programDay?.name ?? "Allenamento libero"}
                    </p>
                    <p className="text-zinc-400 text-xs mt-0.5">{formatDate(session.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="secondary">{session._count.sets} serie</Badge>
                    {session.duration && (
                      <span className="text-xs text-zinc-500">{Math.round(session.duration / 60)} min</span>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmDeleteId(session.id)}
                    className="shrink-0 p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Prima conferma */}
      {confirmDeleteId && !finalConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-500/10 p-2.5 shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold">Elimina sessione</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Vuoi eliminare{" "}
                  <span className="text-zinc-200 font-medium">
                    {sessionToDelete?.programDay?.name ?? "Allenamento libero"}
                  </span>{" "}
                  del {sessionToDelete ? formatDate(sessionToDelete.date) : ""}?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setFinalConfirmId(confirmDeleteId)}
              >
                Elimina
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>
                Annulla
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Seconda conferma (definitiva) */}
      {finalConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-red-500/30 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-500/15 p-2.5 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-red-400">Sei sicuro? Azione irreversibile</p>
                <p className="text-zinc-400 text-sm mt-1">
                  La sessione e tutte le serie registrate verranno eliminate definitivamente. Non è possibile annullare questa operazione.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleting}
                onClick={() => deleteSession(finalConfirmId)}
              >
                {deleting ? "Eliminazione..." : "Sì, elimina"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={deleting}
                onClick={() => { setFinalConfirmId(null); setConfirmDeleteId(null); }}
              >
                Annulla
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
