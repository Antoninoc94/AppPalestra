import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { GenerateWorkoutParams } from "@/types";

const goalConfig: Record<string, { sets: number; reps: string; rest: number }> = {
  strength: { sets: 5, reps: "5", rest: 180 },
  hypertrophy: { sets: 4, reps: "8-12", rest: 90 },
  endurance: { sets: 3, reps: "15-20", rest: 60 },
  weight_loss: { sets: 3, reps: "12-15", rest: 60 },
  general: { sets: 3, reps: "10-12", rest: 90 },
};

const exercisesPerDuration: Record<number, number> = {
  30: 3,
  45: 4,
  60: 5,
  75: 6,
  90: 7,
};

function getExerciseCount(durationMinutes: number): number {
  const keys = Object.keys(exercisesPerDuration).map(Number).sort((a, b) => a - b);
  for (const key of keys) {
    if (durationMinutes <= key) return exercisesPerDuration[key];
  }
  return 8;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: GenerateWorkoutParams = await req.json();
  const { muscleGroups, goal, durationMinutes, difficulty, equipmentIds } = body;

  const config = goalConfig[goal] ?? goalConfig.general;
  const targetCount = getExerciseCount(durationMinutes);

  const muscleGroupRecords = await prisma.muscleGroup.findMany({
    where: { name: { in: muscleGroups } },
  });

  if (muscleGroupRecords.length === 0) {
    return NextResponse.json({ error: "Nessun gruppo muscolare trovato" }, { status: 400 });
  }

  const userId = session.user.id;
  const whereClause: Record<string, unknown> = {
    primaryMuscleId: { in: muscleGroupRecords.map((m) => m.id) },
    difficulty: difficulty === "beginner" ? { in: ["beginner"] } : { in: ["beginner", difficulty] },
    OR: [{ isCustom: false }, { isCustom: true, userId }],
  };

  if (equipmentIds && equipmentIds.length > 0) {
    whereClause.equipment = { some: { equipmentId: { in: equipmentIds } } };
  }

  const exercises = await prisma.exercise.findMany({
    where: whereClause,
    include: {
      primaryMuscle: true,
      equipment: { include: { equipment: true } },
    },
    orderBy: { name: "asc" },
  });

  // Pick exercises: compound first, then isolation
  const compound = exercises.filter((e) =>
    ["barbell", "bodyweight"].some((eq) =>
      e.equipment.some((eq2) => eq2.equipment.name === eq)
    )
  );
  const isolation = exercises.filter((e) => !compound.includes(e));

  const selected: typeof exercises = [];
  const compoundCount = Math.min(Math.ceil(targetCount * 0.4), compound.length);
  const isolationCount = Math.min(targetCount - compoundCount, isolation.length);

  const shuffledCompound = compound.sort(() => Math.random() - 0.5);
  const shuffledIsolation = isolation.sort(() => Math.random() - 0.5);

  selected.push(...shuffledCompound.slice(0, compoundCount));
  selected.push(...shuffledIsolation.slice(0, isolationCount));

  if (selected.length < targetCount) {
    const remaining = exercises.filter((e) => !selected.includes(e));
    selected.push(...remaining.slice(0, targetCount - selected.length));
  }

  const result = {
    goal,
    durationMinutes,
    difficulty,
    exercises: selected.map((ex, i) => ({
      order: i + 1,
      exercise: ex,
      sets: config.sets,
      reps: config.reps,
      restSeconds: config.rest,
    })),
  };

  return NextResponse.json(result);
}
