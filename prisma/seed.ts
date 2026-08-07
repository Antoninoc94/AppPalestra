import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Muscle groups ─────────────────────────────────────────────────────────
const muscleGroups = [
  { name: "chest",       nameIt: "Petto" },
  { name: "lats",        nameIt: "Dorsali" },
  { name: "back",        nameIt: "Schiena" },
  { name: "shoulders",   nameIt: "Spalle" },
  { name: "biceps",      nameIt: "Bicipiti" },
  { name: "triceps",     nameIt: "Tricipiti" },
  { name: "traps",       nameIt: "Trapezi" },
  { name: "quadriceps",  nameIt: "Quadricipiti" },
  { name: "hamstrings",  nameIt: "Femorali" },
  { name: "glutes",      nameIt: "Glutei" },
  { name: "calves",      nameIt: "Polpacci" },
  { name: "core",        nameIt: "Core" },
  { name: "cardio",      nameIt: "Cardio" },
];

// ─── Equipment (junction) ───────────────────────────────────────────────────
const equipmentList = [
  { name: "barbell",      nameIt: "Bilanciere" },
  { name: "dumbbell",     nameIt: "Manubri" },
  { name: "cable",        nameIt: "Cavi" },
  { name: "machine",      nameIt: "Macchinario" },
  { name: "bodyweight",   nameIt: "Corpo libero" },
  { name: "kettlebell",   nameIt: "Kettlebell" },
  { name: "bench",        nameIt: "Panca" },
  { name: "ez_bar",       nameIt: "Bilanciere EZ" },
  { name: "pull_up_bar",  nameIt: "Sbarra trazioni" },
];

// ─── Exercises ──────────────────────────────────────────────────────────────
// category = tipo attrezzo principale (usato come filtro primario nel picker)
// "bilanciere" | "manubri" | "macchinario" | "cavi" | "corpo_libero" | "kettlebell"
const exercises = [

  // ── PETTO ──────────────────────────────────────────────────────────────
  { nameIt: "Panca piana con bilanciere",     muscle: "chest",      equipment: ["barbell","bench"],       category: "bilanciere",   difficulty: "intermediate" },
  { nameIt: "Panca inclinata con bilanciere", muscle: "chest",      equipment: ["barbell","bench"],       category: "bilanciere",   difficulty: "intermediate" },
  { nameIt: "Panca declinata con bilanciere", muscle: "chest",      equipment: ["barbell","bench"],       category: "bilanciere",   difficulty: "intermediate" },
  { nameIt: "Panca piana con manubri",        muscle: "chest",      equipment: ["dumbbell","bench"],      category: "manubri",      difficulty: "beginner" },
  { nameIt: "Panca inclinata con manubri",    muscle: "chest",      equipment: ["dumbbell","bench"],      category: "manubri",      difficulty: "beginner" },
  { nameIt: "Croci con manubri",              muscle: "chest",      equipment: ["dumbbell","bench"],      category: "manubri",      difficulty: "beginner" },
  { nameIt: "Chest press (macchinario)",      muscle: "chest",      equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Peck deck / Butterfly",          muscle: "chest",      equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Croci ai cavi",                  muscle: "chest",      equipment: ["cable"],                category: "cavi",         difficulty: "beginner" },

  // ── DORSALI ────────────────────────────────────────────────────────────
  { nameIt: "Lat machine presa larga",        muscle: "lats",       equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Lat machine presa stretta",      muscle: "lats",       equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Trazioni (Pull up)",             muscle: "lats",       equipment: ["pull_up_bar"],          category: "corpo_libero", difficulty: "intermediate" },
  { nameIt: "Cavo basso seduto",              muscle: "lats",       equipment: ["cable"],                category: "cavi",         difficulty: "beginner" },
  { nameIt: "Pullover al cavo",               muscle: "lats",       equipment: ["cable"],                category: "cavi",         difficulty: "beginner" },

  // ── SCHIENA ────────────────────────────────────────────────────────────
  { nameIt: "Rematore con bilanciere",        muscle: "back",       equipment: ["barbell"],              category: "bilanciere",   difficulty: "intermediate" },
  { nameIt: "Rematore con manubrio",          muscle: "back",       equipment: ["dumbbell","bench"],     category: "manubri",      difficulty: "beginner" },
  { nameIt: "Stacco da terra",                muscle: "back",       equipment: ["barbell"],              category: "bilanciere",   difficulty: "advanced" },
  { nameIt: "Iperestensioni",                 muscle: "back",       equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },

  // ── SPALLE ─────────────────────────────────────────────────────────────
  { nameIt: "Military press con bilanciere",  muscle: "shoulders",  equipment: ["barbell"],              category: "bilanciere",   difficulty: "intermediate" },
  { nameIt: "Shoulder press con manubri",     muscle: "shoulders",  equipment: ["dumbbell"],             category: "manubri",      difficulty: "beginner" },
  { nameIt: "Shoulder press (macchinario)",   muscle: "shoulders",  equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Alzate laterali con manubri",    muscle: "shoulders",  equipment: ["dumbbell"],             category: "manubri",      difficulty: "beginner" },
  { nameIt: "Alzate frontali con manubri",    muscle: "shoulders",  equipment: ["dumbbell"],             category: "manubri",      difficulty: "beginner" },
  { nameIt: "Alzate laterali ai cavi",        muscle: "shoulders",  equipment: ["cable"],                category: "cavi",         difficulty: "beginner" },
  { nameIt: "Face pull al cavo",              muscle: "shoulders",  equipment: ["cable"],                category: "cavi",         difficulty: "beginner" },

  // ── BICIPITI ───────────────────────────────────────────────────────────
  { nameIt: "Curl con bilanciere",            muscle: "biceps",     equipment: ["barbell"],              category: "bilanciere",   difficulty: "beginner" },
  { nameIt: "Curl con bilanciere EZ",         muscle: "biceps",     equipment: ["ez_bar"],               category: "bilanciere",   difficulty: "beginner" },
  { nameIt: "Curl con manubri",               muscle: "biceps",     equipment: ["dumbbell"],             category: "manubri",      difficulty: "beginner" },
  { nameIt: "Curl a martello",                muscle: "biceps",     equipment: ["dumbbell"],             category: "manubri",      difficulty: "beginner" },
  { nameIt: "Curl su panca Scott",            muscle: "biceps",     equipment: ["machine","ez_bar"],     category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Curl ai cavi (cavo basso)",      muscle: "biceps",     equipment: ["cable"],                category: "cavi",         difficulty: "beginner" },

  // ── TRICIPITI ──────────────────────────────────────────────────────────
  { nameIt: "Push down al cavo (corda)",      muscle: "triceps",    equipment: ["cable"],                category: "cavi",         difficulty: "beginner" },
  { nameIt: "Push down al cavo (sbarra)",     muscle: "triceps",    equipment: ["cable"],                category: "cavi",         difficulty: "beginner" },
  { nameIt: "French press con bilanciere EZ", muscle: "triceps",    equipment: ["ez_bar","bench"],       category: "bilanciere",   difficulty: "beginner" },
  { nameIt: "Estensioni sopra la testa",      muscle: "triceps",    equipment: ["dumbbell"],             category: "manubri",      difficulty: "beginner" },
  { nameIt: "Dip alle parallele",             muscle: "triceps",    equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "intermediate" },
  { nameIt: "Kickback con manubrio",          muscle: "triceps",    equipment: ["dumbbell"],             category: "manubri",      difficulty: "beginner" },

  // ── TRAPEZI ────────────────────────────────────────────────────────────
  { nameIt: "Shrug con bilanciere",           muscle: "traps",      equipment: ["barbell"],              category: "bilanciere",   difficulty: "beginner" },
  { nameIt: "Shrug con manubri",              muscle: "traps",      equipment: ["dumbbell"],             category: "manubri",      difficulty: "beginner" },
  { nameIt: "Tirate al mento",               muscle: "traps",      equipment: ["barbell"],              category: "bilanciere",   difficulty: "intermediate" },

  // ── QUADRICIPITI ───────────────────────────────────────────────────────
  { nameIt: "Squat con bilanciere",           muscle: "quadriceps", equipment: ["barbell"],              category: "bilanciere",   difficulty: "intermediate" },
  { nameIt: "Leg press",                      muscle: "quadriceps", equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Leg extension",                  muscle: "quadriceps", equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Hack squat",                     muscle: "quadriceps", equipment: ["machine"],              category: "macchinario",  difficulty: "intermediate" },
  { nameIt: "Affondi con manubri",            muscle: "quadriceps", equipment: ["dumbbell"],             category: "manubri",      difficulty: "beginner" },
  { nameIt: "Bulgarian split squat",          muscle: "quadriceps", equipment: ["dumbbell"],             category: "manubri",      difficulty: "intermediate" },
  { nameIt: "Affondi a corpo libero",         muscle: "quadriceps", equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "beginner" },

  // ── FEMORALI ───────────────────────────────────────────────────────────
  { nameIt: "Leg curl sdraiato",              muscle: "hamstrings", equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Leg curl seduto",                muscle: "hamstrings", equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Stacco rumeno con bilanciere",   muscle: "hamstrings", equipment: ["barbell"],              category: "bilanciere",   difficulty: "intermediate" },
  { nameIt: "Stacco rumeno con manubri",      muscle: "hamstrings", equipment: ["dumbbell"],             category: "manubri",      difficulty: "beginner" },

  // ── GLUTEI ─────────────────────────────────────────────────────────────
  { nameIt: "Hip thrust con bilanciere",      muscle: "glutes",     equipment: ["barbell","bench"],      category: "bilanciere",   difficulty: "intermediate" },
  { nameIt: "Kickback al cavo",               muscle: "glutes",     equipment: ["cable"],                category: "cavi",         difficulty: "beginner" },
  { nameIt: "Abductor machine",               muscle: "glutes",     equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Adductor machine",               muscle: "glutes",     equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Glute bridge",                   muscle: "glutes",     equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "beginner" },

  // ── POLPACCI ───────────────────────────────────────────────────────────
  { nameIt: "Calf raise in piedi (macch.)",   muscle: "calves",     equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Calf raise seduto",              muscle: "calves",     equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },
  { nameIt: "Calf raise al leg press",        muscle: "calves",     equipment: ["machine"],              category: "macchinario",  difficulty: "beginner" },

  // ── CORE ───────────────────────────────────────────────────────────────
  { nameIt: "Crunch",                         muscle: "core",       equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "beginner" },
  { nameIt: "Crunch al cavo",                 muscle: "core",       equipment: ["cable"],                category: "cavi",         difficulty: "beginner" },
  { nameIt: "Leg raise",                      muscle: "core",       equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "beginner" },
  { nameIt: "Plank",                          muscle: "core",       equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "beginner" },
  { nameIt: "Russian twist",                  muscle: "core",       equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "beginner" },
  { nameIt: "Sit up",                         muscle: "core",       equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "beginner" },
  { nameIt: "Mountain climber",               muscle: "core",       equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "beginner" },
  { nameIt: "Ab wheel rollout",               muscle: "core",       equipment: ["machine"],              category: "macchinario",  difficulty: "intermediate" },

  // ── CORPO LIBERO ───────────────────────────────────────────────────────
  { nameIt: "Flessioni (Push up)",            muscle: "chest",      equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "beginner" },
  { nameIt: "Burpees",                        muscle: "cardio",     equipment: ["bodyweight"],           category: "corpo_libero", difficulty: "intermediate" },

  // ── KETTLEBELL ─────────────────────────────────────────────────────────
  { nameIt: "Kettlebell swing",               muscle: "glutes",     equipment: ["kettlebell"],           category: "kettlebell",   difficulty: "beginner" },
  { nameIt: "Kettlebell goblet squat",        muscle: "quadriceps", equipment: ["kettlebell"],           category: "kettlebell",   difficulty: "beginner" },
  { nameIt: "Kettlebell press",               muscle: "shoulders",  equipment: ["kettlebell"],           category: "kettlebell",   difficulty: "intermediate" },
];

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("🗑️  Pulizia dati esistenti...");
  await prisma.workoutSet.deleteMany({});
  await prisma.workoutSession.deleteMany({});
  await prisma.workoutDraft.deleteMany({});
  await prisma.programExercise.deleteMany({});
  await prisma.programDay.deleteMany({});
  await prisma.program.deleteMany({});
  await prisma.exerciseEquipment.deleteMany({});
  await prisma.exercise.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.muscleGroup.deleteMany({});
  console.log("✓ Dati cancellati");

  // Muscle groups
  console.log("💪 Inserimento gruppi muscolari...");
  const mgMap = new Map<string, string>();
  for (const mg of muscleGroups) {
    const rec = await prisma.muscleGroup.create({ data: mg });
    mgMap.set(mg.name, rec.id);
  }

  // Equipment
  console.log("🏋️  Inserimento attrezzatura...");
  const eqMap = new Map<string, string>();
  for (const eq of equipmentList) {
    const rec = await prisma.equipment.create({ data: eq });
    eqMap.set(eq.name, rec.id);
  }

  // Exercises
  console.log("📋 Inserimento esercizi...");
  for (const ex of exercises) {
    const muscleId = mgMap.get(ex.muscle);
    if (!muscleId) { console.warn(`Muscolo non trovato: ${ex.muscle}`); continue; }

    await prisma.exercise.create({
      data: {
        name: ex.nameIt,
        nameIt: ex.nameIt,
        primaryMuscleId: muscleId,
        secondaryMuscles: [],
        category: ex.category,
        difficulty: ex.difficulty,
        isCustom: false,
        equipment: {
          create: ex.equipment
            .filter((e) => eqMap.has(e))
            .map((e) => ({ equipment: { connect: { id: eqMap.get(e)! } } })),
        },
      },
    });
  }
  console.log(`✓ ${exercises.length} esercizi inseriti`);

  // Admin user
  const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!existing) {
    console.log("👤 Creazione utente admin...");
    await prisma.user.create({
      data: {
        username: "admin",
        password: await bcrypt.hash("admin123", 10),
        role: "ADMIN",
      },
    });
    console.log("✓ Admin creato (user: admin, pass: admin123)");
  } else {
    console.log("✓ Admin già esistente, non toccato");
  }

  // AppSettings
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", appName: "App Palestra", primaryColor: "#f97316" },
  });

  console.log("\n✅ Seed completato!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
