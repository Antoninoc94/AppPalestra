export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { NewProgramClient } from "./NewProgramClient";

export default async function NewProgramPage() {
  const [muscleGroups, equipment, exercises] = await Promise.all([
    prisma.muscleGroup.findMany({ orderBy: { nameIt: "asc" } }),
    prisma.equipment.findMany({ orderBy: { nameIt: "asc" } }),
    prisma.exercise.findMany({
      include: {
        primaryMuscle: true,
        equipment: { include: { equipment: true } },
      },
      orderBy: { nameIt: "asc" },
    }),
  ]);

  return (
    <NewProgramClient
      muscleGroups={muscleGroups}
      equipment={equipment}
      exercises={exercises}
    />
  );
}
