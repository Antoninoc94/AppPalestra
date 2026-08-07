import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string; peId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, peId } = await params;
  const body = await req.json();

  const program = await prisma.program.findFirst({ where: { id, userId: session.user.id } });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["sets", "reps", "restSeconds", "weight", "notes", "order"] as const;
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const updated = await prisma.programExercise.update({
    where: { id: peId },
    data,
    include: { exercise: { include: { primaryMuscle: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string; peId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, peId } = await params;

  const program = await prisma.program.findFirst({ where: { id, userId: session.user.id } });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.programExercise.delete({ where: { id: peId } });

  return NextResponse.json({ ok: true });
}
