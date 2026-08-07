export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./ProfileClient";

async function getProfileData(userId: string) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const [totalSessions, totalSetsResult, durationResult, user, prGroups, weekSessions] =
    await Promise.all([
      prisma.workoutSession.count({ where: { userId } }),
      prisma.workoutSet.count({ where: { session: { userId } } }),
      prisma.workoutSession.aggregate({
        where: { userId },
        _sum: { duration: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true, firstName: true, lastName: true, trainingDays: true },
      }),
      prisma.workoutSet.groupBy({
        by: ["exerciseId"],
        where: { session: { userId }, weight: { not: null, gt: 0 } },
        _max: { weight: true },
        orderBy: { _max: { weight: "desc" } },
        take: 5,
      }),
      prisma.workoutSession.findMany({
        where: { userId, date: { gte: startOfWeek } },
        select: { date: true },
      }),
    ]);

  let personalRecords: Array<{ name: string; weight: number }> = [];
  if (prGroups.length > 0) {
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: prGroups.map((g) => g.exerciseId) } },
      select: { id: true, name: true, nameIt: true },
    });
    personalRecords = prGroups
      .map((g) => {
        const ex = exercises.find((e) => e.id === g.exerciseId);
        return { name: ex?.nameIt ?? ex?.name ?? "—", weight: g._max.weight! };
      })
      .sort((a, b) => b.weight - a.weight);
  }

  const trainedDaysThisWeek = [...new Set(weekSessions.map((s) => new Date(s.date).getDay()))];

  return {
    totalSessions,
    totalSets: totalSetsResult,
    totalDurationSeconds: durationResult._sum.duration ?? 0,
    memberSince: user?.createdAt ?? new Date(),
    firstName: user?.firstName ?? null,
    lastName: user?.lastName ?? null,
    trainingDays: user?.trainingDays ?? [],
    trainedDaysThisWeek,
    personalRecords,
  };
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profileData = await getProfileData(session.user.id);

  return (
    <ProfileClient
      username={session.user.name}
      role={session.user.role}
      {...profileData}
    />
  );
}
