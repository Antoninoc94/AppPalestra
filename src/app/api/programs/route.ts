import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const programs = await prisma.program.findMany({
    include: {
      days: {
        include: {
          exercises: {
            include: { exercise: { include: { primaryMuscle: true } } },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { dayNumber: "asc" },
      },
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(programs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, goal, days } = body;

  const program = await prisma.program.create({
    data: {
      name,
      description,
      goal,
      days: {
        create: days.map((day: { name: string; dayNumber: number; exercises: Array<{ exerciseId: string; order: number; sets: number; reps: string; restSeconds: number; weight?: number; notes?: string }> }) => ({
          name: day.name,
          dayNumber: day.dayNumber,
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              order: ex.order,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds ?? 90,
              weight: ex.weight ?? null,
              notes: ex.notes ?? null,
            })),
          },
        })),
      },
    },
    include: {
      days: {
        include: {
          exercises: { include: { exercise: true } },
        },
      },
    },
  });

  return NextResponse.json(program, { status: 201 });
}
