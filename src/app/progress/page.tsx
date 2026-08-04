export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ProgressClient } from "./ProgressClient";

export default async function ProgressPage() {
  const [exercises, recentSessions] = await Promise.all([
    prisma.exercise.findMany({
      select: { id: true, name: true, nameIt: true },
      orderBy: { nameIt: "asc" },
    }),
    prisma.workoutSession.findMany({
      take: 10,
      orderBy: { date: "desc" },
      include: {
        _count: { select: { sets: true } },
        programDay: { select: { name: true } },
      },
    }),
  ]);

  return <ProgressClient exercises={exercises} recentSessions={recentSessions} />;
}
