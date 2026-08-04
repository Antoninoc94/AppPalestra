import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const muscleId = searchParams.get("muscle");
  const equipmentId = searchParams.get("equipment");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where: Record<string, unknown> = {};
  if (muscleId) where.primaryMuscleId = muscleId;
  if (difficulty) where.difficulty = difficulty;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { nameIt: { contains: search, mode: "insensitive" } },
    ];
  }
  if (equipmentId) {
    where.equipment = { some: { equipmentId } };
  }

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      include: {
        primaryMuscle: true,
        equipment: { include: { equipment: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nameIt: "asc" },
    }),
    prisma.exercise.count({ where }),
  ]);

  return NextResponse.json({ exercises, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, nameIt, description, primaryMuscleId, secondaryMuscles, equipmentIds, category, difficulty } = body;

  const exercise = await prisma.exercise.create({
    data: {
      name,
      nameIt,
      description,
      primaryMuscleId,
      secondaryMuscles: secondaryMuscles ?? [],
      category,
      difficulty,
      isCustom: true,
      equipment: {
        create: (equipmentIds ?? []).map((id: string) => ({
          equipment: { connect: { id } },
        })),
      },
    },
    include: {
      primaryMuscle: true,
      equipment: { include: { equipment: true } },
    },
  });

  return NextResponse.json(exercise, { status: 201 });
}
