export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { WorkoutClient } from "./WorkoutClient";

export default async function WorkoutPage() {
  const [programs, exercises] = await Promise.all([
    prisma.program.findMany({
      where: { isActive: true },
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
      include: { primaryMuscle: true },
      orderBy: { nameIt: "asc" },
    }),
  ]);

  return <WorkoutClient programs={programs} allExercises={exercises} />;
}
