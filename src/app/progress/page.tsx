export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProgressClient } from "./ProgressClient";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    loggedExerciseRows,
    prStats,
    totalSessions,
    sessionsThisMonth,
    totalSets,
    recentSessions,
  ] = await Promise.all([
    prisma.workoutSet.findMany({
      where: { session: { userId } },
      select: { exerciseId: true },
      distinct: ["exerciseId"],
    }),
    prisma.workoutSet.groupBy({
      by: ["exerciseId"],
      where: { session: { userId }, weight: { not: null } },
      _max: { weight: true },
    }),
    prisma.workoutSession.count({ where: { userId } }),
    prisma.workoutSession.count({ where: { userId, date: { gte: startOfMonth } } }),
    prisma.workoutSet.count({ where: { session: { userId } } }),
    prisma.workoutSession.findMany({
      where: { userId },
      take: 10,
      orderBy: { date: "desc" },
      include: {
        _count: { select: { sets: true } },
        programDay: { select: { name: true } },
      },
    }),
  ]);

  const exerciseIds = loggedExerciseRows.map((r) => r.exerciseId);

  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { id: true, name: true, nameIt: true },
    orderBy: { nameIt: "asc" },
  });

  const prMap: Record<string, number> = {};
  for (const pr of prStats) {
    if (pr._max.weight != null) prMap[pr.exerciseId] = pr._max.weight;
  }

  const exercisesWithPR = exercises.map((ex) => ({
    ...ex,
    bestWeight: prMap[ex.id] ?? null,
  }));

  return (
    <ProgressClient
      exercises={exercisesWithPR}
      recentSessions={recentSessions}
      stats={{ totalSessions, sessionsThisMonth, totalSets }}
    />
  );
}
