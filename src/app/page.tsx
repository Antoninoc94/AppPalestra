export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Flame, Calendar, TrendingUp, Plus, Play, ClipboardList } from "lucide-react";
import Link from "next/link";
import { ActiveWorkoutBanner } from "@/components/ActiveWorkoutBanner";

async function getStats(userId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [totalSessions, lastSession, activeProgramsList, totalSets, sessionsThisWeek] = await Promise.all([
    prisma.workoutSession.count({ where: { userId } }),
    prisma.workoutSession.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      include: { programDay: true, _count: { select: { sets: true } } },
    }),
    prisma.program.findMany({
      where: { userId, isActive: true },
      include: {
        days: {
          include: { _count: { select: { exercises: true } } },
          orderBy: { dayNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workoutSet.count({ where: { session: { userId } } }),
    prisma.workoutSession.count({ where: { userId, date: { gte: weekAgo } } }),
  ]);

  return { totalSessions, lastSession, activeProgramsList, activePrograms: activeProgramsList.length, totalSets, sessionsThisWeek };
}

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { totalSessions, lastSession, activeProgramsList, activePrograms, totalSets, sessionsThisWeek } =
    await getStats(session.user.id);

  const today = new Date();

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-zinc-400 text-sm capitalize">{formatDate(today)}</p>
        <h1 className="text-2xl font-bold">Ciao, {session.user.name} 👋</h1>
        <p className="text-zinc-400 text-sm">Pronto per allenarti?</p>
      </div>

      {/* Resume active workout banner (client — reads localStorage) */}
      <ActiveWorkoutBanner />

      {/* Active programs quick-start */}
      {activeProgramsList.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Schede attive
          </h2>
          {activeProgramsList.map((program) => (
            <div key={program.id} className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium pl-1">{program.name}</p>
              <div className="grid grid-cols-1 gap-2">
                {program.days.map((day) => (
                  <Link key={day.id} href="/workout">
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-orange-500/40 active:bg-zinc-800 transition-all">
                      <div>
                        <p className="font-semibold text-sm">{day.name}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{day._count.exercises} esercizi</p>
                      </div>
                      <div className="rounded-xl bg-orange-500/10 p-2">
                        <Play className="h-4 w-4 text-orange-400 fill-current" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Fallback CTA when no active programs */
        <Link href="/workout">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 p-5 shadow-lg shadow-orange-900/30">
            <div className="relative z-10">
              <p className="text-orange-100 text-sm font-medium mb-1">Inizia ora</p>
              <h2 className="text-white text-xl font-bold">Allenamento di oggi</h2>
              <p className="text-orange-100 text-sm mt-1">
                {lastSession ? `Ultimo: ${formatDate(lastSession.date)}` : "Nessun allenamento ancora"}
              </p>
            </div>
            <Dumbbell className="absolute right-4 top-4 h-16 w-16 text-orange-400/30" />
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                <Plus className="h-4 w-4" />
                Allenamento libero
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="rounded-lg bg-orange-500/10 p-2 w-fit mb-2">
              <Flame className="h-4 w-4 text-orange-400" />
            </div>
            <p className="text-2xl font-bold">{sessionsThisWeek}</p>
            <p className="text-zinc-400 text-xs mt-0.5">Sessioni questa settimana</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="rounded-lg bg-blue-500/10 p-2 w-fit mb-2">
              <Calendar className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold">{totalSessions}</p>
            <p className="text-zinc-400 text-xs mt-0.5">Sessioni totali</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="rounded-lg bg-purple-500/10 p-2 w-fit mb-2">
              <Dumbbell className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold">{totalSets}</p>
            <p className="text-zinc-400 text-xs mt-0.5">Serie totali completate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="rounded-lg bg-green-500/10 p-2 w-fit mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold">{activePrograms}</p>
            <p className="text-zinc-400 text-xs mt-0.5">Schede attive</p>
          </CardContent>
        </Card>
      </div>

      {/* Last session */}
      {lastSession && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-300">Ultima sessione</h2>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {lastSession.programDay?.name ?? "Allenamento libero"}
                  </p>
                  <p className="text-zinc-400 text-sm">{formatDate(lastSession.date)}</p>
                </div>
                <Badge variant="secondary">{lastSession._count.sets} serie</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick links */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-300">Accesso rapido</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/programs/new">
            <Button variant="outline" className="w-full h-12 justify-start gap-3">
              <Plus className="h-4 w-4 text-orange-400" />
              Nuova scheda
            </Button>
          </Link>
          <Link href="/progress">
            <Button variant="outline" className="w-full h-12 justify-start gap-3">
              <TrendingUp className="h-4 w-4 text-green-400" />
              Progressi
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
