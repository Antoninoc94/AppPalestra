import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("exerciseIds")?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) return NextResponse.json({});

  // For each exerciseId, find the most recent session's sets
  const recentSets = await prisma.workoutSet.findMany({
    where: { exerciseId: { in: ids }, session: { userId } },
    orderBy: { session: { date: "desc" } },
    distinct: ["exerciseId"],
    include: { session: { select: { id: true, date: true } } },
  });

  const result: Record<string, { date: string; sets: { weight: number | null; reps: number }[] }> = {};

  for (const { exerciseId, session: s } of recentSets) {
    const allSets = await prisma.workoutSet.findMany({
      where: { exerciseId, sessionId: s.id },
      orderBy: { setNumber: "asc" },
      select: { weight: true, reps: true },
    });
    result[exerciseId] = { date: s.date.toISOString(), sets: allSets };
  }

  return NextResponse.json(result);
}
