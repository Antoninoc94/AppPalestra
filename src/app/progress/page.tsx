export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProgressClient } from "./ProgressClient";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const [exercises, recentSessions] = await Promise.all([
    prisma.exercise.findMany({
      where: { OR: [{ isCustom: false }, { isCustom: true, userId }] },
      select: { id: true, name: true, nameIt: true },
      orderBy: { nameIt: "asc" },
    }),
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

  return <ProgressClient exercises={exercises} recentSessions={recentSessions} />;
}
