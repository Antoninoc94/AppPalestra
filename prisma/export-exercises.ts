/**
 * Esporta tutti gli esercizi in CSV.
 * Esegui con:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/export-exercises.ts > exercises.csv
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const exercises = await prisma.exercise.findMany({
    include: {
      primaryMuscle: true,
      equipment: { include: { equipment: true } },
    },
    orderBy: [{ primaryMuscle: { nameIt: "asc" } }, { nameIt: "asc" }],
  });

  // Header CSV
  console.log("Nome italiano,Nome inglese,Gruppo muscolare,Difficoltà,Categoria,Attrezzatura");

  for (const ex of exercises) {
    const equipment = ex.equipment.map((e) => e.equipment.nameIt).join(" / ") || "Corpo libero";
    const difficulty = ex.difficulty === "beginner" ? "Principiante" : ex.difficulty === "advanced" ? "Avanzato" : "Intermedio";
    const row = [
      ex.nameIt ?? ex.name,
      ex.name,
      ex.primaryMuscle.nameIt,
      difficulty,
      ex.category,
      equipment,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    console.log(row);
  }

  process.stderr.write(`\nTotale: ${exercises.length} esercizi\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
