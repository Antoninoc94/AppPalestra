import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exercises = await prisma.exercise.findMany({
    include: {
      primaryMuscle: true,
      equipment: { include: { equipment: true } },
    },
    orderBy: [{ primaryMuscle: { nameIt: "asc" } }, { nameIt: "asc" }],
  });

  const diffLabel = (d: string) =>
    d === "beginner" ? "Principiante" : d === "advanced" ? "Avanzato" : "Intermedio";

  const escape = (v: string) => `"${v.replace(/"/g, '""').replace(/\n/g, " | ")}"`;

  const header = ["Nome italiano", "Nome inglese", "Gruppo muscolare", "Difficoltà", "Categoria", "Attrezzatura", "Descrizione"];

  const rows = exercises.map((ex) => [
    ex.nameIt ?? ex.name,
    ex.name,
    ex.primaryMuscle.nameIt,
    diffLabel(ex.difficulty),
    ex.category,
    ex.equipment.map((e) => e.equipment.nameIt).join(" / ") || "Corpo libero",
    ex.description ?? "",
  ].map(escape).join(","));

  const csv = [header.map(escape).join(","), ...rows].join("\n");
  const bom = "﻿"; // BOM per Excel con caratteri speciali

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="esercizi-apppalestra.csv"`,
    },
  });
}
