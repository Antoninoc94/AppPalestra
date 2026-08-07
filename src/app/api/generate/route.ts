import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { GenerateWorkoutParams } from "@/types";

const goalConfig: Record<string, { sets: number; reps: string; rest: number }> = {
  strength:    { sets: 5, reps: "3-5",   rest: 180 },
  hypertrophy: { sets: 4, reps: "8-12",  rest: 90 },
  endurance:   { sets: 3, reps: "15-20", rest: 60 },
  weight_loss: { sets: 3, reps: "12-15", rest: 60 },
  general:     { sets: 3, reps: "10-12", rest: 90 },
};

const exercisesPerDuration: Record<number, number> = {
  30: 3,
  45: 4,
  60: 5,
  75: 6,
  90: 7,
};

function getExerciseCount(minutes: number): number {
  const keys = Object.keys(exercisesPerDuration).map(Number).sort((a, b) => a - b);
  for (const k of keys) if (minutes <= k) return exercisesPerDuration[k];
  return 8;
}

// Distribute `total` slots across `groups` groups as evenly as possible
function distributeSlots(total: number, groups: number): number[] {
  if (groups === 0) return [];
  const base = Math.floor(total / groups);
  const extra = total % groups;
  return Array.from({ length: groups }, (_, i) => base + (i < extra ? 1 : 0));
}

// Compound movements get priority in ordering (multi-joint, bigger stimulus)
const COMPOUND_KEYWORDS = [
  "squat", "stacco", "panca", "military", "press", "rematore",
  "trazioni", "dip", "hip thrust", "affondi", "split squat",
  "hack", "pullover", "lento avanti", "tirate al mento",
];

function isCompound(ex: { nameIt: string | null; name: string }): boolean {
  const name = (ex.nameIt ?? ex.name).toLowerCase();
  return COMPOUND_KEYWORDS.some((kw) => name.includes(kw));
}

function isBodyweight(e: { equipment: Array<{ equipment: { name: string } }> }): boolean {
  if (e.equipment.length === 0) return true;
  return e.equipment.every((eq) => {
    const n = eq.equipment.name.toLowerCase().replace(/[\s_-]/g, "");
    return n === "bodyweight" || n === "pullupbar";
  });
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: GenerateWorkoutParams = await req.json();
  const { muscleGroups, goal, durationMinutes, difficulty, equipmentPreference = "any" } = body;

  const config = goalConfig[goal] ?? goalConfig.general;
  const targetCount = getExerciseCount(durationMinutes);
  const userId = session.user.id;

  const muscleGroupRecords = await prisma.muscleGroup.findMany({
    where: { name: { in: muscleGroups } },
  });

  if (muscleGroupRecords.length === 0) {
    return NextResponse.json({ error: "Nessun gruppo muscolare trovato" }, { status: 400 });
  }

  // Fetch all candidate exercises for selected muscle groups
  const difficultyFilter = difficulty === "beginner"
    ? { in: ["beginner"] }
    : { in: ["beginner", difficulty] };

  const allExercises = await prisma.exercise.findMany({
    where: {
      primaryMuscleId: { in: muscleGroupRecords.map((m) => m.id) },
      difficulty: difficultyFilter,
      OR: [{ isCustom: false }, { isCustom: true, userId }],
    },
    include: {
      primaryMuscle: true,
      equipment: { include: { equipment: true } },
    },
  });

  // Apply equipment preference filter
  let pool = allExercises;
  if (equipmentPreference === "bodyweight") {
    const bw = allExercises.filter(isBodyweight);
    if (bw.length >= 2) pool = bw;
  } else if (equipmentPreference === "equipment") {
    const eq = allExercises.filter((e) => !isBodyweight(e));
    if (eq.length >= 2) pool = eq;
  }

  // ── Smart selection ──────────────────────────────────────────────────────
  // 1. Group exercises by primary muscle
  const byMuscle = new Map<string, typeof pool>();
  for (const mg of muscleGroupRecords) {
    const group = pool.filter((e) => e.primaryMuscleId === mg.id);
    if (group.length > 0) byMuscle.set(mg.id, group);
  }

  const activeGroups = Array.from(byMuscle.keys());
  const slots = distributeSlots(targetCount, activeGroups.length);

  const selected: typeof pool = [];
  const usedIds = new Set<string>();

  // 2. For each muscle group, pick compound-first, then isolation (shuffled within tier)
  for (let i = 0; i < activeGroups.length; i++) {
    const groupPool = byMuscle.get(activeGroups[i])!;
    const n = slots[i];
    if (n === 0) continue;

    const compounds  = shuffle(groupPool.filter(isCompound));
    const isolations = shuffle(groupPool.filter((e) => !isCompound(e)));
    const ordered = [...compounds, ...isolations];

    let picked = 0;
    for (const ex of ordered) {
      if (picked >= n) break;
      if (!usedIds.has(ex.id)) {
        selected.push(ex);
        usedIds.add(ex.id);
        picked++;
      }
    }
  }

  // 3. Pad if pool was thin (no duplicates guaranteed by usedIds)
  if (selected.length < targetCount) {
    const remaining = shuffle(pool.filter((e) => !usedIds.has(e.id)));
    for (const ex of remaining) {
      if (selected.length >= targetCount) break;
      selected.push(ex);
      usedIds.add(ex.id);
    }
  }

  // 4. Final ordering: all compound first, then isolation
  const finalOrder = [
    ...selected.filter(isCompound),
    ...selected.filter((e) => !isCompound(e)),
  ];

  return NextResponse.json({
    goal,
    durationMinutes,
    difficulty,
    exercises: finalOrder.map((ex, i) => ({
      order: i + 1,
      exercise: ex,
      sets: config.sets,
      reps: config.reps,
      restSeconds: config.rest,
    })),
  });
}
