import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, dayId } = await params;
  const { weekDays } = await req.json();

  const program = await prisma.program.findFirst({ where: { id, userId: session.user.id } });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.programDay.update({
    where: { id: dayId },
    data: { weekDays: Array.isArray(weekDays) ? weekDays : [] },
    select: { id: true, weekDays: true },
  });

  return NextResponse.json(updated);
}
