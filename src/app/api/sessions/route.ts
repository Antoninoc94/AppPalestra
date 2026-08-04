import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const [sessions, total] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId },
      include: {
        program: { select: { id: true, name: true } },
        programDay: { select: { id: true, name: true } },
        _count: { select: { sets: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workoutSession.count({ where: { userId } }),
  ]);

  return NextResponse.json({ sessions, total, page, limit });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { programId, programDayId, notes, duration, sets } = body;

  if (programId) {
    const program = await prisma.program.findFirst({ where: { id: programId, userId } });
    if (!program) return NextResponse.json({ error: "Programma non trovato" }, { status: 400 });
  }

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      programId: programId ?? null,
      programDayId: programDayId ?? null,
      notes: notes ?? null,
      duration: duration ?? null,
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
