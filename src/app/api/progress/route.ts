import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId");

  if (!exerciseId) return NextResponse.json({ error: "exerciseId required" }, { status: 400 });

  const sets = await prisma.workoutSet.findMany({
    where: { exerciseId, session: { userId } },
    include: { session: { select: { date: true } } },
    orderBy: { session: { date: "asc" } },
  });

  const byDate = new Map<string, { maxWeight: number; totalVolume: number }>();

  for (const set of sets) {
    const date = set.session.date.toISOString().split("T")[0];
    const weight = set.weight ?? 0;
    const volume = weight * set.reps;

    if (!byDate.has(date)) {
      byDate.set(date, { maxWeight: weight, totalVolume: volume });
    } else {
      const existing = byDate.get(date)!;
      byDate.set(date, {
        maxWeight: Math.max(existing.maxWeight, weight),
        totalVolume: existing.totalVolume + volume,
      });
    }
  }

  const result = Array.from(byDate.entries()).map(([date, data]) => ({
    date: date.slice(5),
    ...data,
  }));

  return NextResponse.json(result);
}
