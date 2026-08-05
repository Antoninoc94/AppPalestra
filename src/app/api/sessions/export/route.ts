import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: {
      programDay: { select: { name: true } },
      sets: {
        orderBy: [{ exercise: { name: "asc" } }, { setNumber: "asc" }],
        include: { exercise: { select: { name: true, nameIt: true } } },
      },
    },
  });

  const rows: string[] = [
    "Data,Sessione,Esercizio,Serie,Ripetizioni,Peso (kg),Durata (min)",
  ];

  for (const s of sessions) {
    const date = new Date(s.date).toLocaleDateString("it-IT");
    const sessionName = s.programDay?.name ?? "Allenamento libero";
    const durationMin = s.duration ? Math.round(s.duration / 60) : "";

    if (s.sets.length === 0) {
      rows.push(`"${date}","${sessionName}","","","","","${durationMin}"`);
      continue;
    }

    s.sets.forEach((set, i) => {
      const exName = set.exercise.nameIt ?? set.exercise.name;
      const dur = i === 0 ? durationMin : "";
      rows.push(
        `"${date}","${sessionName}","${exName}","${set.setNumber}","${set.reps}","${set.weight ?? ""}","${dur}"`
      );
    });
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="allenamenti-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
