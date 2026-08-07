import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, dayId } = await params;
  const { exerciseId, sets, reps, restSeconds, weight, notes } = await req.json();

  const program = await prisma.program.findFirst({ where: { id, userId: session.user.id } });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const count = await prisma.programExercise.count({ where: { programDayId: dayId } });

  const pe = await prisma.programExercise.create({
    data: {
      programDayId: dayId,
      exerciseId,
      order: count,
      sets: sets ?? 3,
      reps: reps ?? "10",
      restSeconds: restSeconds ?? 90,
      weight: weight ?? null,
      notes: notes ?? null,
    },
    include: { exercise: { include: { primaryMuscle: true } } },
  });

  return NextResponse.json(pe);
}
