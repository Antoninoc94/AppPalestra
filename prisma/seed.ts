import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const muscleGroups = [
  { name: "chest", nameIt: "Petto" },
  { name: "back", nameIt: "Schiena" },
  { name: "shoulders", nameIt: "Spalle" },
  { name: "biceps", nameIt: "Bicipiti" },
  { name: "triceps", nameIt: "Tricipiti" },
  { name: "legs", nameIt: "Gambe" },
  { name: "quadriceps", nameIt: "Quadricipiti" },
  { name: "hamstrings", nameIt: "Femorali" },
  { name: "glutes", nameIt: "Glutei" },
  { name: "calves", nameIt: "Polpacci" },
  { name: "core", nameIt: "Core / Addome" },
  { name: "forearms", nameIt: "Avambracci" },
  { name: "traps", nameIt: "Trapezi" },
  { name: "lats", nameIt: "Dorsali" },
  { name: "cardio", nameIt: "Cardio" },
];

const equipmentList = [
  { name: "barbell", nameIt: "Bilanciere" },
  { name: "dumbbell", nameIt: "Manubri" },
  { name: "cable", nameIt: "Cavi" },
  { name: "machine", nameIt: "Macchina" },
  { name: "bodyweight", nameIt: "Corpo libero" },
  { name: "kettlebell", nameIt: "Kettlebell" },
  { name: "resistance_band", nameIt: "Elastici" },
  { name: "pull_up_bar", nameIt: "Sbarra trazioni" },
  { name: "bench", nameIt: "Panca" },
  { name: "ez_bar", nameIt: "Bilanciere EZ" },
  { name: "smith_machine", nameIt: "Smith Machine" },
  { name: "treadmill", nameIt: "Tapis roulant" },
];

const exercises = [
  // PETTO
  { name: "Barbell Bench Press", nameIt: "Panca piana con bilanciere", muscle: "chest", secondary: ["triceps", "shoulders"], equipment: ["barbell", "bench"], category: "strength", difficulty: "intermediate" },
  { name: "Incline Barbell Bench Press", nameIt: "Panca inclinata con bilanciere", muscle: "chest", secondary: ["triceps", "shoulders"], equipment: ["barbell", "bench"], category: "strength", difficulty: "intermediate" },
  { name: "Decline Barbell Bench Press", nameIt: "Panca declinata con bilanciere", muscle: "chest", secondary: ["triceps"], equipment: ["barbell", "bench"], category: "strength", difficulty: "intermediate" },
  { name: "Dumbbell Bench Press", nameIt: "Panca piana con manubri", muscle: "chest", secondary: ["triceps", "shoulders"], equipment: ["dumbbell", "bench"], category: "strength", difficulty: "beginner" },
  { name: "Incline Dumbbell Bench Press", nameIt: "Panca inclinata con manubri", muscle: "chest", secondary: ["triceps", "shoulders"], equipment: ["dumbbell", "bench"], category: "strength", difficulty: "beginner" },
  { name: "Dumbbell Flyes", nameIt: "Croci con manubri", muscle: "chest", secondary: [], equipment: ["dumbbell", "bench"], category: "strength", difficulty: "beginner" },
  { name: "Cable Crossover", nameIt: "Croci ai cavi", muscle: "chest", secondary: [], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "Push-Up", nameIt: "Flessioni", muscle: "chest", secondary: ["triceps", "shoulders"], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },
  { name: "Wide Push-Up", nameIt: "Flessioni larghe", muscle: "chest", secondary: ["triceps"], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },
  { name: "Chest Dips", nameIt: "Dip al petto", muscle: "chest", secondary: ["triceps"], equipment: ["bodyweight"], category: "strength", difficulty: "intermediate" },
  { name: "Pec Deck Machine", nameIt: "Pec deck (farfalla)", muscle: "chest", secondary: [], equipment: ["machine"], category: "strength", difficulty: "beginner" },
  { name: "Smith Machine Bench Press", nameIt: "Panca piana con Smith Machine", muscle: "chest", secondary: ["triceps"], equipment: ["smith_machine", "bench"], category: "strength", difficulty: "beginner" },

  // SCHIENA / DORSALI
  { name: "Pull-Up", nameIt: "Trazioni alla sbarra", muscle: "lats", secondary: ["biceps", "traps"], equipment: ["pull_up_bar"], category: "strength", difficulty: "intermediate" },
  { name: "Chin-Up", nameIt: "Trazioni presa supina", muscle: "lats", secondary: ["biceps"], equipment: ["pull_up_bar"], category: "strength", difficulty: "intermediate" },
  { name: "Barbell Row", nameIt: "Rematore con bilanciere", muscle: "back", secondary: ["biceps", "lats", "traps"], equipment: ["barbell"], category: "strength", difficulty: "intermediate" },
  { name: "Dumbbell Row", nameIt: "Rematore con manubrio", muscle: "back", secondary: ["biceps", "lats"], equipment: ["dumbbell", "bench"], category: "strength", difficulty: "beginner" },
  { name: "Seated Cable Row", nameIt: "Rematore ai cavi seduto", muscle: "back", secondary: ["biceps", "lats"], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "Lat Pulldown", nameIt: "Lat Machine", muscle: "lats", secondary: ["biceps"], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "Wide Grip Lat Pulldown", nameIt: "Lat Machine presa larga", muscle: "lats", secondary: ["biceps"], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "Deadlift", nameIt: "Stacco da terra", muscle: "back", secondary: ["hamstrings", "glutes", "traps", "core"], equipment: ["barbell"], category: "strength", difficulty: "advanced" },
  { name: "Romanian Deadlift", nameIt: "Stacco rumeno", muscle: "hamstrings", secondary: ["glutes", "back"], equipment: ["barbell"], category: "strength", difficulty: "intermediate" },
  { name: "Face Pull", nameIt: "Face pull", muscle: "traps", secondary: ["shoulders"], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "T-Bar Row", nameIt: "Rematore T-bar", muscle: "back", secondary: ["biceps", "lats"], equipment: ["barbell"], category: "strength", difficulty: "intermediate" },
  { name: "Hyperextension", nameIt: "Iperestensioni", muscle: "back", secondary: ["glutes", "hamstrings"], equipment: ["machine"], category: "strength", difficulty: "beginner" },
  { name: "Straight Arm Pulldown", nameIt: "Pullover ai cavi", muscle: "lats", secondary: [], equipment: ["cable"], category: "strength", difficulty: "beginner" },

  // SPALLE
  { name: "Barbell Overhead Press", nameIt: "Lento avanti con bilanciere", muscle: "shoulders", secondary: ["triceps", "traps"], equipment: ["barbell"], category: "strength", difficulty: "intermediate" },
  { name: "Dumbbell Shoulder Press", nameIt: "Lento avanti con manubri", muscle: "shoulders", secondary: ["triceps"], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Arnold Press", nameIt: "Arnold press", muscle: "shoulders", secondary: ["triceps"], equipment: ["dumbbell"], category: "strength", difficulty: "intermediate" },
  { name: "Lateral Raises", nameIt: "Alzate laterali", muscle: "shoulders", secondary: [], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Front Raises", nameIt: "Alzate frontali", muscle: "shoulders", secondary: [], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Rear Delt Flyes", nameIt: "Alzate posteriori", muscle: "shoulders", secondary: ["traps"], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Cable Lateral Raises", nameIt: "Alzate laterali ai cavi", muscle: "shoulders", secondary: [], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "Upright Row", nameIt: "Rematore verticale", muscle: "shoulders", secondary: ["traps", "biceps"], equipment: ["barbell"], category: "strength", difficulty: "intermediate" },
  { name: "Machine Shoulder Press", nameIt: "Spinte con macchina", muscle: "shoulders", secondary: ["triceps"], equipment: ["machine"], category: "strength", difficulty: "beginner" },
  { name: "Shrugs", nameIt: "Scrollate (Shrugs)", muscle: "traps", secondary: [], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Barbell Shrugs", nameIt: "Scrollate con bilanciere", muscle: "traps", secondary: [], equipment: ["barbell"], category: "strength", difficulty: "beginner" },

  // BICIPITI
  { name: "Barbell Curl", nameIt: "Curl con bilanciere", muscle: "biceps", secondary: ["forearms"], equipment: ["barbell"], category: "strength", difficulty: "beginner" },
  { name: "Dumbbell Curl", nameIt: "Curl con manubri", muscle: "biceps", secondary: ["forearms"], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Hammer Curl", nameIt: "Curl martello", muscle: "biceps", secondary: ["forearms"], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Preacher Curl", nameIt: "Curl al panchetto Scott", muscle: "biceps", secondary: [], equipment: ["barbell", "machine"], category: "strength", difficulty: "beginner" },
  { name: "Cable Curl", nameIt: "Curl ai cavi", muscle: "biceps", secondary: [], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "EZ-Bar Curl", nameIt: "Curl con bilanciere EZ", muscle: "biceps", secondary: ["forearms"], equipment: ["ez_bar"], category: "strength", difficulty: "beginner" },
  { name: "Concentration Curl", nameIt: "Curl di concentrazione", muscle: "biceps", secondary: [], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Incline Dumbbell Curl", nameIt: "Curl su panca inclinata", muscle: "biceps", secondary: [], equipment: ["dumbbell", "bench"], category: "strength", difficulty: "beginner" },

  // TRICIPITI
  { name: "Triceps Dips", nameIt: "Dip ai tricipiti", muscle: "triceps", secondary: ["chest"], equipment: ["bodyweight"], category: "strength", difficulty: "intermediate" },
  { name: "Close Grip Bench Press", nameIt: "Panca presa stretta", muscle: "triceps", secondary: ["chest"], equipment: ["barbell", "bench"], category: "strength", difficulty: "intermediate" },
  { name: "Skull Crushers", nameIt: "Estensioni francesi", muscle: "triceps", secondary: [], equipment: ["barbell", "bench"], category: "strength", difficulty: "intermediate" },
  { name: "Triceps Pushdown", nameIt: "Pushdown ai cavi", muscle: "triceps", secondary: [], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "Overhead Triceps Extension", nameIt: "Estensioni sopra la testa", muscle: "triceps", secondary: [], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Kickbacks", nameIt: "Kickback tricipiti", muscle: "triceps", secondary: [], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Rope Pushdown", nameIt: "Pushdown con fune", muscle: "triceps", secondary: [], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "Diamond Push-Up", nameIt: "Flessioni a diamante", muscle: "triceps", secondary: ["chest"], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },

  // GAMBE - QUADRICIPITI
  { name: "Barbell Squat", nameIt: "Squat con bilanciere", muscle: "quadriceps", secondary: ["glutes", "hamstrings", "core"], equipment: ["barbell"], category: "strength", difficulty: "advanced" },
  { name: "Front Squat", nameIt: "Squat frontale", muscle: "quadriceps", secondary: ["glutes", "core"], equipment: ["barbell"], category: "strength", difficulty: "advanced" },
  { name: "Leg Press", nameIt: "Leg press", muscle: "quadriceps", secondary: ["glutes", "hamstrings"], equipment: ["machine"], category: "strength", difficulty: "beginner" },
  { name: "Hack Squat", nameIt: "Hack squat", muscle: "quadriceps", secondary: ["glutes"], equipment: ["machine"], category: "strength", difficulty: "intermediate" },
  { name: "Leg Extension", nameIt: "Leg extension", muscle: "quadriceps", secondary: [], equipment: ["machine"], category: "strength", difficulty: "beginner" },
  { name: "Lunges", nameIt: "Affondi", muscle: "quadriceps", secondary: ["glutes", "hamstrings"], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },
  { name: "Dumbbell Lunges", nameIt: "Affondi con manubri", muscle: "quadriceps", secondary: ["glutes", "hamstrings"], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Bulgarian Split Squat", nameIt: "Split squat bulgaro", muscle: "quadriceps", secondary: ["glutes"], equipment: ["dumbbell", "bench"], category: "strength", difficulty: "intermediate" },
  { name: "Smith Machine Squat", nameIt: "Squat alla Smith Machine", muscle: "quadriceps", secondary: ["glutes"], equipment: ["smith_machine"], category: "strength", difficulty: "beginner" },
  { name: "Goblet Squat", nameIt: "Goblet squat", muscle: "quadriceps", secondary: ["glutes", "core"], equipment: ["kettlebell"], category: "strength", difficulty: "beginner" },

  // GAMBE - FEMORALI / GLUTEI
  { name: "Leg Curl", nameIt: "Leg curl", muscle: "hamstrings", secondary: [], equipment: ["machine"], category: "strength", difficulty: "beginner" },
  { name: "Stiff Leg Deadlift", nameIt: "Stacco gambe tese", muscle: "hamstrings", secondary: ["glutes", "back"], equipment: ["barbell"], category: "strength", difficulty: "intermediate" },
  { name: "Hip Thrust", nameIt: "Hip thrust", muscle: "glutes", secondary: ["hamstrings"], equipment: ["barbell", "bench"], category: "strength", difficulty: "intermediate" },
  { name: "Glute Bridge", nameIt: "Ponte glutei", muscle: "glutes", secondary: ["hamstrings"], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },
  { name: "Cable Kickbacks", nameIt: "Kickback glutei ai cavi", muscle: "glutes", secondary: [], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "Sumo Squat", nameIt: "Squat sumo", muscle: "glutes", secondary: ["quadriceps", "hamstrings"], equipment: ["dumbbell"], category: "strength", difficulty: "beginner" },
  { name: "Step Up", nameIt: "Step up", muscle: "quadriceps", secondary: ["glutes"], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },

  // POLPACCI
  { name: "Standing Calf Raises", nameIt: "Calf raises in piedi", muscle: "calves", secondary: [], equipment: ["machine"], category: "strength", difficulty: "beginner" },
  { name: "Seated Calf Raises", nameIt: "Calf raises seduto", muscle: "calves", secondary: [], equipment: ["machine"], category: "strength", difficulty: "beginner" },
  { name: "Donkey Calf Raises", nameIt: "Calf raises ciuco", muscle: "calves", secondary: [], equipment: ["machine"], category: "strength", difficulty: "beginner" },

  // CORE / ADDOME
  { name: "Plank", nameIt: "Plank", muscle: "core", secondary: [], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },
  { name: "Crunch", nameIt: "Crunch", muscle: "core", secondary: [], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },
  { name: "Leg Raises", nameIt: "Sollevamento gambe", muscle: "core", secondary: [], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },
  { name: "Russian Twists", nameIt: "Russian twist", muscle: "core", secondary: [], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },
  { name: "Ab Wheel Rollout", nameIt: "Rotella addominali", muscle: "core", secondary: [], equipment: ["bodyweight"], category: "strength", difficulty: "intermediate" },
  { name: "Cable Crunch", nameIt: "Crunch ai cavi", muscle: "core", secondary: [], equipment: ["cable"], category: "strength", difficulty: "beginner" },
  { name: "Hanging Leg Raises", nameIt: "Sollevamento gambe alla sbarra", muscle: "core", secondary: [], equipment: ["pull_up_bar"], category: "strength", difficulty: "intermediate" },
  { name: "Mountain Climbers", nameIt: "Mountain climbers", muscle: "core", secondary: ["cardio"], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },
  { name: "Side Plank", nameIt: "Plank laterale", muscle: "core", secondary: [], equipment: ["bodyweight"], category: "strength", difficulty: "beginner" },
  { name: "V-Up", nameIt: "V-up", muscle: "core", secondary: [], equipment: ["bodyweight"], category: "strength", difficulty: "intermediate" },

  // CARDIO
  { name: "Treadmill Running", nameIt: "Corsa su tapis roulant", muscle: "cardio", secondary: ["legs"], equipment: ["treadmill"], category: "cardio", difficulty: "beginner" },
  { name: "Jumping Jacks", nameIt: "Jumping jacks", muscle: "cardio", secondary: [], equipment: ["bodyweight"], category: "cardio", difficulty: "beginner" },
  { name: "Burpees", nameIt: "Burpees", muscle: "cardio", secondary: ["core", "chest"], equipment: ["bodyweight"], category: "cardio", difficulty: "intermediate" },
  { name: "Jump Rope", nameIt: "Corda per saltare", muscle: "cardio", secondary: ["calves"], equipment: ["bodyweight"], category: "cardio", difficulty: "beginner" },
  { name: "Box Jump", nameIt: "Salto sulla pedana", muscle: "legs", secondary: ["cardio"], equipment: ["bodyweight"], category: "plyometrics", difficulty: "intermediate" },
];

async function main() {
  console.log("🌱 Avvio seed database...");

  await prisma.exerciseEquipment.deleteMany();
  await prisma.workoutSet.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.programExercise.deleteMany();
  await prisma.programDay.deleteMany();
  await prisma.program.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.muscleGroup.deleteMany();

  console.log("📦 Inserimento gruppi muscolari...");
  const muscleMap: Record<string, string> = {};
  for (const mg of muscleGroups) {
    const created = await prisma.muscleGroup.create({ data: mg });
    muscleMap[mg.name] = created.id;
  }

  console.log("🏋️ Inserimento attrezzature...");
  const equipmentMap: Record<string, string> = {};
  for (const eq of equipmentList) {
    const created = await prisma.equipment.create({ data: eq });
    equipmentMap[eq.name] = created.id;
  }

  console.log("💪 Inserimento esercizi...");
  for (const ex of exercises) {
    const muscleId = muscleMap[ex.muscle];
    if (!muscleId) {
      console.warn(`⚠️ Gruppo muscolare non trovato: ${ex.muscle} per ${ex.name}`);
      continue;
    }

    await prisma.exercise.create({
      data: {
        name: ex.name,
        nameIt: ex.nameIt,
        primaryMuscleId: muscleId,
        secondaryMuscles: ex.secondary,
        category: ex.category,
        difficulty: ex.difficulty,
        isCustom: false,
        equipment: {
          create: ex.equipment
            .filter((e) => equipmentMap[e])
            .map((e) => ({
              equipment: { connect: { id: equipmentMap[e] } },
            })),
        },
      },
    });
  }

  const exerciseCount = await prisma.exercise.count();
  console.log(`✅ Seed completato! ${exerciseCount} esercizi inseriti.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
