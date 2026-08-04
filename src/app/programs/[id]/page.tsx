export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProgramDetailClient } from "./ProgramDetailClient";

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!program) notFound();

  return <ProgramDetailClient program={program} />;
}
