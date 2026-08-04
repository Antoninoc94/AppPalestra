import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const program = await prisma.program.findFirst({
    where: { id, userId },
    include: {
      days: {
        include: {
          exercises: {
            include: {
              exercise: { include: { primaryMuscle: true } },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { dayNumber: "asc" },
      },
      sessions: {
        take: 5,
        orderBy: { date: "desc" },
        include: {
          _count: { select: { sets: true } },
          programDay: { select: { name: true } },
        },
      },
      _count: { select: { sessions: true } },
    },
  });

  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(program);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ["name", "description", "goal", "isActive"] as const;
  const data = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k as typeof allowed[number]))
  );

  const existing = await prisma.program.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.program.update({ where: { id }, data });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.program.deleteMany({ where: { id, userId } });

  return NextResponse.json({ success: true });
}
