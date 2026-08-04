/**
 * Importa esercizi da free-exercise-db (873 esercizi open source).
 * Esegui con:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/import-exercises.ts
 *
 * - Aggiunge solo esercizi non ancora presenti (match per name, case-insensitive)
 * - Non tocca esercizi utente, schede o sessioni
 * - Esercizi compound con primaryMuscle=quadriceps → mappati a "legs" (Gambe)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as https from "https";
import type { IncomingMessage } from "http";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DB_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

// ── Mapping gruppi muscolari ──────────────────────────────────────────────────
// Sinistra = nome nel free-exercise-db, Destra = nome nel nostro schema
const MUSCLE_MAP: Record<string, string> = {
  abdominals:    "core",
  abductors:     "glutes",
  adductors:     "legs",
  biceps:        "biceps",
  calves:        "calves",
  chest:         "chest",
  forearms:      "forearms",
  glutes:        "glutes",
  hamstrings:    "hamstrings",
  lats:          "lats",
  "lower back":  "back",
  "middle back": "back",
  neck:          "traps",
  quadriceps:    "quadriceps",  // compound → sovrascritta sotto
  shoulders:     "shoulders",
  traps:         "traps",
  triceps:       "triceps",
};

// ── Mapping attrezzatura ──────────────────────────────────────────────────────
const EQUIPMENT_MAP: Record<string, string> = {
  "body only":  "bodyweight",
  barbell:      "barbell",
  dumbbell:     "dumbbell",
  cable:        "cable",
  machine:      "machine",
  bands:        "resistance_band",
  kettlebells:  "kettlebell",
  "e-z curl bar": "ez_bar",
  // exercise ball / foam roll / medicine ball / other → ignorati
};

// Categorie da importare (escludi stretching)
const ALLOWED_CATEGORIES = new Set([
  "strength",
  "cardio",
  "plyometrics",
  "powerlifting",
  "olympic weightlifting",
  "strongman",
]);

// Muscoli da escludere completamente
const SKIP_MUSCLES = new Set(["neck"]);

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
    level: string;
    category: string;
    equipment: string | null;
    mechanic: string | null;
    primaryMuscles: string[];
    secondaryMuscles: string[];
  }>;
  console.log(`   Scaricati ${raw.length} esercizi.`);

  // Carica mappa gruppi muscolari dal DB
  const mgRecords = await prisma.muscleGroup.findMany();
  const mgByName: Record<string, string> = {};
  for (const mg of mgRecords) mgByName[mg.name] = mg.id;

  // Carica mappa attrezzatura
  const eqRecords = await prisma.equipment.findMany();
  const eqByName: Record<string, string> = {};
  for (const eq of eqRecords) eqByName[eq.name] = eq.id;

  // Nomi esercizi già presenti (lowercase per confronto)
  const existing = await prisma.exercise.findMany({ where: { isCustom: false }, select: { name: true } });
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

  let added = 0;
  let skipped_existing = 0;
  let skipped_no_muscle = 0;
  let skipped_category = 0;

  for (const ex of raw) {
    // Salta categorie non utili
    if (!ALLOWED_CATEGORIES.has(ex.category)) {
      skipped_category++;
      continue;
    }

    const primarySource = ex.primaryMuscles[0];
    if (!primarySource || SKIP_MUSCLES.has(primarySource)) {
      skipped_no_muscle++;
      continue;
    }

    // Compound quadriceps → "legs" (Gambe), isolation rimane "quadriceps"
    let targetMuscle = MUSCLE_MAP[primarySource] ?? primarySource;
    if (primarySource === "quadriceps" && ex.mechanic === "compound") {
      targetMuscle = "legs";
    }

    const primaryMuscleId = mgByName[targetMuscle];
    if (!primaryMuscleId) {
      skipped_no_muscle++;
      continue;
    }

    // Salta se già presente
    if (existingNames.has(ex.name.toLowerCase())) {
      skipped_existing++;
      continue;
    }

    // Mappa secondaryMuscles
    const secondary = (ex.secondaryMuscles ?? [])
      .map((m: string) => MUSCLE_MAP[m] ?? m)
      .filter((m: string) => mgByName[m]);

    // Mappa equipment
    const equipmentIds: string[] = [];
    if (ex.equipment) {
      const mapped = EQUIPMENT_MAP[ex.equipment];
      if (mapped && eqByName[mapped]) equipmentIds.push(eqByName[mapped]);
    }

    // Mappa difficulty
    const difficulty = ex.level === "expert" ? "advanced" : (ex.level ?? "intermediate");

    // Mappa category
    const category = ["powerlifting","olympic weightlifting","strongman"].includes(ex.category)
      ? "strength"
      : ex.category;

    await prisma.exercise.create({
      data: {
        name: ex.name,
        nameIt: ex.name, // fallback inglese; traducibile dall'admin in futuro
        primaryMuscleId,
        secondaryMuscles: secondary,
        category,
        difficulty,
        isCustom: false,
        equipment: {
          create: equipmentIds.map((id) => ({
            equipment: { connect: { id } },
          })),
        },
      },
    });

    existingNames.add(ex.name.toLowerCase());
    added++;

    if (added % 50 === 0) process.stdout.write(`   ${added} aggiunti...\r`);
  }

  const total = await prisma.exercise.count({ where: { isCustom: false } });

  console.log(`\n✅ Importazione completata:`);
  console.log(`   Aggiunti:         ${added}`);
  console.log(`   Già presenti:     ${skipped_existing}`);
  console.log(`   Senza muscolo:    ${skipped_no_muscle}`);
  console.log(`   Categoria skip:   ${skipped_category}`);
  console.log(`   Totale nel DB:    ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
