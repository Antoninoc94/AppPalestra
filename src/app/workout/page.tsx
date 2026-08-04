export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkoutClient } from "./WorkoutClient";

export default async function WorkoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const [programs, exercises] = await Promise.all([
    prisma.program.findMany({
      where: { userId, isActive: true },
      include: {
        days: {
          include: {
            exercises: {
              include: {
                exercise: { include: { primaryMuscle: true } },
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { dayNumber: "asc" },
        },
      },
    }),
    prisma.exercise.findMany({
      where: { OR: [{ isCustom: false }, { isCustom: true, userId }] },
      include: { primaryMuscle: true },
      orderBy: { nameIt: "asc" },
    }),
  ]);

  return <WorkoutClient programs={programs} allExercises={exercises} />;
}
