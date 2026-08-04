import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const text = await req.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV vuoto" }, { status: 400 });
  }

  // Parsifica una riga CSV rispettando i campi tra virgolette
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const header = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const colNomeIt    = header.indexOf("nomitaliano");
  const colNomeEn   = header.indexOf("nominglese");
  const colDesc     = header.indexOf("descrizione");

  if (colNomeEn === -1) {
    return NextResponse.json({ error: "Colonna 'Nome inglese' non trovata" }, { status: 400 });
  }

  let updated = 0;
  let notFound = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const nameEn  = cols[colNomeEn]  ?? "";
    const nameIt  = colNomeIt  >= 0 ? (cols[colNomeIt]  ?? "") : "";
    const desc    = colDesc    >= 0 ? (cols[colDesc]    ?? "") : "";

    if (!nameEn) continue;

    const exercise = await prisma.exercise.findFirst({
      where: { name: { equals: nameEn, mode: "insensitive" }, isCustom: false },
      select: { id: true },
    });

    if (!exercise) { notFound++; continue; }

    const data: Record<string, string> = {};
    if (nameIt) data.nameIt = nameIt;
    if (desc)   data.description = desc;
    if (Object.keys(data).length === 0) continue;

    await prisma.exercise.update({ where: { id: exercise.id }, data });
    updated++;
  }

  return NextResponse.json({ updated, notFound, total: lines.length - 1 });
}
