import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json(null, { status: 401 });

  const draft = await prisma.workoutDraft.findUnique({ where: { userId: session.user.id } });
  if (!draft) return NextResponse.json(null);
  try {
    return NextResponse.json(JSON.parse(draft.data));
  } catch {
    return NextResponse.json(null);
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const data = await req.json();
  await prisma.workoutDraft.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, data: JSON.stringify(data) },
    update: { data: JSON.stringify(data) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  await prisma.workoutDraft.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
