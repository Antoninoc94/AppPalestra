export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExercisesClient } from "./ExercisesClient";

export default async function ExercisesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [muscleGroups, equipment] = await Promise.all([
    prisma.muscleGroup.findMany({ orderBy: { nameIt: "asc" } }),
    prisma.equipment.findMany({ orderBy: { nameIt: "asc" } }),
  ]);

  return <ExercisesClient muscleGroups={muscleGroups} equipment={equipment} />;
}
