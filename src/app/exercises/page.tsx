export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ExercisesClient } from "./ExercisesClient";

export default async function ExercisesPage() {
  const [muscleGroups, equipment] = await Promise.all([
    prisma.muscleGroup.findMany({ orderBy: { nameIt: "asc" } }),
    prisma.equipment.findMany({ orderBy: { nameIt: "asc" } }),
  ]);

  return <ExercisesClient muscleGroups={muscleGroups} equipment={equipment} />;
}
