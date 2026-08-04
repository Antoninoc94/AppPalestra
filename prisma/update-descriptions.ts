/**
 * Popola il campo description degli esercizi importati da free-exercise-db.
 * Aggiorna solo esercizi con description = null.
 * Esegui con:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/update-descriptions.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as https from "https";
import type { IncomingMessage } from "http";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DB_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

function fetch_json(url: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    https.get(url, (res: IncomingMessage) => {
      let data = "";
      res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function main() {
  console.log("⬇️  Download free-exercise-db...");
  const raw = await fetch_json(DB_URL) as Array<{
    name: string;
    instructions: string[];
  }>;
  console.log(`   Scaricati ${raw.length} esercizi.`);

  // Mappa nome → istruzioni
  const instructionsByName = new Map<string, string>();
  for (const ex of raw) {
    if (!ex.instructions || ex.instructions.length === 0) continue;
    const steps = ex.instructions
      .map((step, i) => `${i + 1}. ${step.trim()}`)
      .join("\n");
    instructionsByName.set(ex.name.toLowerCase(), steps);
  }

  // Carica esercizi non custom senza description
  const exercises = await prisma.exercise.findMany({
    where: { isCustom: false, description: null },
    select: { id: true, name: true },
  });
  console.log(`   Esercizi da aggiornare: ${exercises.length}`);

  let updated = 0;
  let notFound = 0;

  for (const ex of exercises) {
    const desc = instructionsByName.get(ex.name.toLowerCase());
    if (!desc) {
      notFound++;
      continue;
    }
    await prisma.exercise.update({
      where: { id: ex.id },
      data: { description: desc },
    });
    updated++;
    if (updated % 50 === 0) process.stdout.write(`   ${updated} aggiornati...\r`);
  }

  console.log(`\n✅ Completato:`);
  console.log(`   Descrizioni aggiunte:  ${updated}`);
  console.log(`   Senza corrispondenza:  ${notFound}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
