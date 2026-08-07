export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDuration, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Flame, Calendar, Dumbbell, TrendingUp, Play, ClipboardList,
  Clock, Zap, Plus, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { ActiveWorkoutBanner } from "@/components/ActiveWorkoutBanner";
import { PendingProgramBanner } from "@/components/PendingProgramBanner";

async function getStats(userId: string) {
  const now = new Date();

  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalSessions,
    recentSessions,
    activeProgramsList,
    totalSets,
    sessionsThisWeek,
    sessionsLast7Days,
    setsThisWeek,
  ] = await Promise.all([
    prisma.workoutSession.count({ where: { userId } }),
    prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 3,
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
    prisma.workoutSession.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      select: { date: true },
    }),
    prisma.workoutSet.count({
      where: { session: { userId, date: { gte: weekAgo } } },
    }),
  ]);

  // Activity dots: 7 days (i=0 → 6 days ago, i=6 → today)
  const activeDaySet = new Set(
    sessionsLast7Days.map((s) => {
      const d = new Date(s.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  const activityDots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    return {
      day: d.toLocaleDateString("it-IT", { weekday: "short" }),
      active: activeDaySet.has(key),
      isToday: i === 6,
    };
  });

  // Streak: consecutive active days ending today or yesterday
  let streak = 0;
  const startIdx = activityDots[6].active ? 6 : activityDots[5]?.active ? 5 : -1;
  if (startIdx >= 0) {
    for (let i = startIdx; i >= 0; i--) {
      if (activityDots[i].active) streak++;
      else break;
    }
  }

  return {
    totalSessions,
    recentSessions,
    lastSession: recentSessions[0] ?? null,
    activeProgramsList,
    totalSets,
    sessionsThisWeek,
    setsThisWeek,
    streak,
    activityDots,
  };
}

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const {
    totalSessions, recentSessions, lastSession,
    activeProgramsList, totalSets, sessionsThisWeek,
    setsThisWeek, streak, activityDots,
  } = await getStats(session.user.id);

  const now = new Date();

  const hour = parseInt(
    now.toLocaleString("en-US", { timeZone: "Europe/Rome", hour: "numeric", hour12: false })
  );
  const greeting =
    hour >= 5 && hour < 12 ? "Buongiorno"
    : hour >= 12 && hour < 18 ? "Buon pomeriggio"
    : "Buona sera";

  const displayName = session.user.name ?? "Atleta";

  return (
    <div className="px-4 py-6 space-y-5 pb-28">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-zinc-500 text-sm capitalize">
            {now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-2xl font-bold mt-0.5">{greeting}, {displayName}!</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {lastSession
              ? `Ultimo allenamento ${formatDate(lastSession.date)}`
              : "Inizia il tuo primo allenamento 💪"}
          </p>
        </div>
        {streak > 1 && (
          <div className="flex flex-col items-center rounded-2xl bg-orange-500/10 border border-orange-500/20 px-3 py-2 shrink-0">
            <span className="text-xl leading-none">🔥</span>
            <span className="text-orange-400 font-bold text-lg leading-tight mt-0.5">{streak}</span>
            <span className="text-zinc-500 text-[9px] leading-tight">giorni</span>
          </div>
        )}
      </div>

      {/* ── Banners ── */}
      <ActiveWorkoutBanner userId={session.user.id} />
      <PendingProgramBanner userId={session.user.id} />

      {/* ── 7-day activity ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Attività ultimi 7 giorni · {sessionsThisWeek} questa settimana
        </p>
        <div className="flex justify-between">
          {activityDots.map(({ day, active, isToday }, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center transition-all",
                  active
                    ? "bg-orange-500 shadow-md shadow-orange-500/30"
                    : isToday
                    ? "bg-zinc-800 ring-2 ring-zinc-600"
                    : "bg-zinc-800"
                )}
              >
                {active && (
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium capitalize",
                  isToday ? "text-orange-400" : "text-zinc-600"
                )}
              >
                {day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick start ── */}
      {activeProgramsList.length > 0 ? (
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5" />
            Schede attive
          </h2>
          {activeProgramsList.map((program) => (
            <div key={program.id} className="space-y-2">
              {activeProgramsList.length > 1 && (
                <p className="text-xs text-zinc-500 font-medium pl-1">{program.name}</p>
              )}
              {program.days.map((day) => (
                <Link key={day.id} href="/workout">
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 hover:border-orange-500/40 active:bg-zinc-800 transition-all">
                    <div>
                      <p className="font-semibold text-sm">{day.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {program.name} · {day._count.exercises} esercizi
                      </p>
                    </div>
                    <div className="rounded-xl bg-orange-500/10 p-2.5">
                      <Play className="h-4 w-4 text-orange-400 fill-current" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
          <Link href="/workout">
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 px-4 py-3 text-zinc-500 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-all">
              <Plus className="h-4 w-4" />
              Allenamento libero
            </div>
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          <Link href="/workout">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 p-5 shadow-lg shadow-orange-900/30">
              <div className="relative z-10">
                <p className="text-white text-sm font-medium mb-1" style={{ opacity: 0.8 }}>Inizia ora</p>
                <h2 className="text-white text-xl font-bold">Allenamento libero</h2>
                <p className="text-white text-sm mt-1" style={{ opacity: 0.7 }}>
                  {lastSession ? `Ultimo: ${formatDate(lastSession.date)}` : "Il tuo primo allenamento ti aspetta!"}
                </p>
              </div>
              <Dumbbell className="absolute right-4 top-4 h-16 w-16 text-white/10" />
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white">
                  Inizia <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
          <Link href="/programs/new">
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 px-4 py-3 text-zinc-500 text-sm hover:border-orange-500/40 hover:text-zinc-300 transition-all">
              <Plus className="h-4 w-4" />
              Crea la tua prima scheda
            </div>
          </Link>
        </div>
      )}

      {/* ── Stats ── */}
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
            <div className="rounded-lg bg-yellow-500/10 p-2 w-fit mb-2">
              <Zap className="h-4 w-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold">{setsThisWeek}</p>
            <p className="text-zinc-400 text-xs mt-0.5">Serie questa settimana</p>
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
            <p className="text-zinc-400 text-xs mt-0.5">Serie totali</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent sessions ── */}
      {recentSessions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Sessioni recenti
            </h2>
            <Link href="/progress" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-0.5">
              Vedi tutto <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3"
              >
                <div className="rounded-xl bg-zinc-800 p-2 shrink-0">
                  <Dumbbell className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {s.programDay?.name ?? "Allenamento libero"}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">{formatDate(s.date)}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-sm font-semibold text-zinc-200">{s._count.sets} serie</p>
                  {s.duration != null && s.duration > 0 && (
                    <p className="text-xs text-zinc-500">{formatDuration(s.duration)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state (no sessions yet) ── */}
      {recentSessions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-8 text-center space-y-2">
          <TrendingUp className="h-8 w-8 text-zinc-700 mx-auto" />
          <p className="text-zinc-400 text-sm font-medium">I tuoi progressi appariranno qui</p>
          <p className="text-zinc-600 text-xs">Completa il tuo primo allenamento per iniziare</p>
        </div>
      )}
    </div>
  );
}
