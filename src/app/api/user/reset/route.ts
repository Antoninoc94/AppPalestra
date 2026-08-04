import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const userId = session.user.id;

  // Elimina in ordine: sessioni (cascade → set), poi programmi (cascade → giorni → esercizi), poi esercizi custom
  await prisma.$transaction([
    prisma.workoutSession.deleteMany({ where: { userId } }),
    prisma.program.deleteMany({ where: { userId } }),
    prisma.exercise.deleteMany({ where: { userId, isCustom: true } }),
  ]);

  return NextResponse.json({ ok: true });
}
