import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const [sessions, total] = await Promise.all([
    prisma.workoutSession.findMany({
      include: {
        program: { select: { id: true, name: true } },
        programDay: { select: { id: true, name: true } },
        _count: { select: { sets: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workoutSession.count(),
  ]);

  return NextResponse.json({ sessions, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { programId, programDayId, notes, sets } = body;

  const session = await prisma.workoutSession.create({
    data: {
      programId: programId ?? null,
      programDayId: programDayId ?? null,
      notes: notes ?? null,
      sets: {
        create: sets.map((s: { exerciseId: string; setNumber: number; reps: number; weight?: number; restSeconds?: number; notes?: string }) => ({
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          reps: s.reps,
          weight: s.weight ?? null,
          restSeconds: s.restSeconds ?? null,
          notes: s.notes ?? null,
        })),
      },
    },
    include: {
      sets: { include: { exercise: true } },
    },
  });

  return NextResponse.json(session, { status: 201 });
}
