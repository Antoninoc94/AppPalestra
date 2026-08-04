import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id },
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

  if (!program) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(program);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const program = await prisma.program.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(program);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await prisma.program.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
