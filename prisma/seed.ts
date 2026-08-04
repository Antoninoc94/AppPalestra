import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const muscleGroups = [
  { name: "chest",       nameIt: "Petto" },
  { name: "back",        nameIt: "Schiena" },
  { name: "shoulders",   nameIt: "Spalle" },
  { name: "biceps",      nameIt: "Bicipiti" },
  { name: "triceps",     nameIt: "Tricipiti" },
  { name: "legs",        nameIt: "Gambe" },
  { name: "quadriceps",  nameIt: "Quadricipiti" },
  { name: "hamstrings",  nameIt: "Femorali" },
  { name: "glutes",      nameIt: "Glutei" },
  { name: "calves",      nameIt: "Polpacci" },
  { name: "core",        nameIt: "Core / Addome" },
  { name: "forearms",    nameIt: "Avambracci" },
  { name: "traps",       nameIt: "Trapezi" },
  { name: "lats",        nameIt: "Dorsali" },
  { name: "cardio",      nameIt: "Cardio" },
];

const equipmentList = [
  { name: "barbell",         nameIt: "Bilanciere" },
  { name: "dumbbell",        nameIt: "Manubri" },
  { name: "cable",           nameIt: "Cavi" },
  { name: "machine",         nameIt: "Macchina" },
  { name: "bodyweight",      nameIt: "Corpo libero" },
  { name: "kettlebell",      nameIt: "Kettlebell" },
  { name: "resistance_band", nameIt: "Elastici" },
  { name: "pull_up_bar",     nameIt: "Sbarra trazioni" },
  { name: "bench",           nameIt: "Panca" },
  { name: "ez_bar",          nameIt: "Bilanciere EZ" },
  { name: "smith_machine",   nameIt: "Smith Machine" },
  { name: "treadmill",       nameIt: "Tapis roulant" },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISES
// muscle = primaryMuscle key (must match muscleGroups[].name)
// "legs"       → esercizi composti per le gambe (selezionando "Gambe" li vedi tutti)
// "quadriceps" → isolamento quad
// "hamstrings" → isolamento femorali
// "glutes"     → isolamento glutei
// ─────────────────────────────────────────────────────────────────────────────
const exercises = [

  // ── PETTO ─────────────────────────────────────────────────────────────────
  { name: "Barbell Bench Press",          nameIt: "Panca piana con bilanciere",        muscle: "chest",      secondary: ["triceps","shoulders"], equipment: ["barbell","bench"],        category: "strength",    difficulty: "intermediate" },
  { name: "Incline Barbell Bench Press",  nameIt: "Panca inclinata con bilanciere",    muscle: "chest",      secondary: ["triceps","shoulders"], equipment: ["barbell","bench"],        category: "strength",    difficulty: "intermediate" },
  { name: "Decline Barbell Bench Press",  nameIt: "Panca declinata con bilanciere",    muscle: "chest",      secondary: ["triceps"],            equipment: ["barbell","bench"],        category: "strength",    difficulty: "intermediate" },
  { name: "Dumbbell Bench Press",         nameIt: "Panca piana con manubri",           muscle: "chest",      secondary: ["triceps","shoulders"], equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "beginner" },
  { name: "Incline Dumbbell Bench Press", nameIt: "Panca inclinata con manubri",       muscle: "chest",      secondary: ["triceps","shoulders"], equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "beginner" },
  { name: "Decline Dumbbell Bench Press", nameIt: "Panca declinata con manubri",       muscle: "chest",      secondary: ["triceps"],            equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "beginner" },
  { name: "Dumbbell Flyes",               nameIt: "Croci con manubri",                 muscle: "chest",      secondary: [],                     equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "beginner" },
  { name: "Incline Dumbbell Flyes",       nameIt: "Croci inclinate con manubri",       muscle: "chest",      secondary: [],                     equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "beginner" },
  { name: "Cable Crossover",              nameIt: "Croci ai cavi",                     muscle: "chest",      secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "High Cable Crossover",         nameIt: "Croci ai cavi alti",                muscle: "chest",      secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Low Cable Crossover",          nameIt: "Croci ai cavi bassi",               muscle: "chest",      secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Push-Up",                      nameIt: "Flessioni",                         muscle: "chest",      secondary: ["triceps","shoulders"], equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Wide Push-Up",                 nameIt: "Flessioni larghe",                  muscle: "chest",      secondary: ["triceps"],            equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Chest Dips",                   nameIt: "Dip al petto",                      muscle: "chest",      secondary: ["triceps"],            equipment: ["bodyweight"],             category: "strength",    difficulty: "intermediate" },
  { name: "Pec Deck Machine",             nameIt: "Pec deck (farfalla)",               muscle: "chest",      secondary: [],                     equipment: ["machine"],                category: "strength",    difficulty: "beginner" },
  { name: "Smith Machine Bench Press",    nameIt: "Panca piana con Smith Machine",     muscle: "chest",      secondary: ["triceps"],            equipment: ["smith_machine","bench"],  category: "strength",    difficulty: "beginner" },
  { name: "Landmine Press",               nameIt: "Landmine press",                    muscle: "chest",      secondary: ["shoulders","triceps"], equipment: ["barbell"],               category: "strength",    difficulty: "intermediate" },

  // ── DORSALI / SCHIENA ─────────────────────────────────────────────────────
  { name: "Pull-Up",                      nameIt: "Trazioni alla sbarra",              muscle: "lats",       secondary: ["biceps","traps"],      equipment: ["pull_up_bar"],            category: "strength",    difficulty: "intermediate" },
  { name: "Chin-Up",                      nameIt: "Trazioni presa supina",             muscle: "lats",       secondary: ["biceps"],             equipment: ["pull_up_bar"],            category: "strength",    difficulty: "intermediate" },
  { name: "Neutral Grip Pull-Up",         nameIt: "Trazioni presa neutra",             muscle: "lats",       secondary: ["biceps"],             equipment: ["pull_up_bar"],            category: "strength",    difficulty: "intermediate" },
  { name: "Lat Pulldown",                 nameIt: "Lat Machine presa larga",           muscle: "lats",       secondary: ["biceps"],             equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Close Grip Lat Pulldown",      nameIt: "Lat Machine presa stretta",         muscle: "lats",       secondary: ["biceps"],             equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Straight Arm Pulldown",        nameIt: "Pullover ai cavi",                  muscle: "lats",       secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Barbell Row",                  nameIt: "Rematore con bilanciere",            muscle: "back",       secondary: ["biceps","lats","traps"],equipment: ["barbell"],              category: "strength",    difficulty: "intermediate" },
  { name: "Dumbbell Row",                 nameIt: "Rematore con manubrio",             muscle: "back",       secondary: ["biceps","lats"],      equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "beginner" },
  { name: "Seated Cable Row",             nameIt: "Rematore ai cavi seduto",           muscle: "back",       secondary: ["biceps","lats"],      equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "T-Bar Row",                    nameIt: "Rematore T-bar",                    muscle: "back",       secondary: ["biceps","lats"],      equipment: ["barbell"],               category: "strength",    difficulty: "intermediate" },
  { name: "Deadlift",                     nameIt: "Stacco da terra",                   muscle: "back",       secondary: ["hamstrings","glutes","traps","core"], equipment: ["barbell"], category: "strength", difficulty: "advanced" },
  { name: "Sumo Deadlift",                nameIt: "Stacco sumo",                       muscle: "back",       secondary: ["glutes","hamstrings","core"],          equipment: ["barbell"], category: "strength", difficulty: "advanced" },
  { name: "Deficit Deadlift",             nameIt: "Stacco da terra con deficit",        muscle: "back",       secondary: ["hamstrings","glutes"],  equipment: ["barbell"],             category: "strength",    difficulty: "advanced" },
  { name: "Face Pull",                    nameIt: "Face pull",                         muscle: "traps",      secondary: ["shoulders"],          equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Hyperextension",               nameIt: "Iperestensioni",                    muscle: "back",       secondary: ["glutes","hamstrings"],equipment: ["machine"],               category: "strength",    difficulty: "beginner" },
  { name: "Chest Supported Row",          nameIt: "Rematore su panca inclinata",       muscle: "back",       secondary: ["biceps","lats"],      equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "beginner" },
  { name: "Pendlay Row",                  nameIt: "Pendlay row",                       muscle: "back",       secondary: ["biceps","lats"],      equipment: ["barbell"],               category: "strength",    difficulty: "advanced" },
  { name: "Meadows Row",                  nameIt: "Meadows row",                       muscle: "back",       secondary: ["biceps","lats"],      equipment: ["barbell"],               category: "strength",    difficulty: "intermediate" },

  // ── TRAPEZI ───────────────────────────────────────────────────────────────
  { name: "Shrugs",                       nameIt: "Scrollate con manubri",             muscle: "traps",      secondary: [],                     equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Barbell Shrugs",               nameIt: "Scrollate con bilanciere",          muscle: "traps",      secondary: [],                     equipment: ["barbell"],               category: "strength",    difficulty: "beginner" },
  { name: "Cable Shrugs",                 nameIt: "Scrollate ai cavi",                 muscle: "traps",      secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },

  // ── SPALLE ────────────────────────────────────────────────────────────────
  { name: "Barbell Overhead Press",       nameIt: "Lento avanti con bilanciere",       muscle: "shoulders",  secondary: ["triceps","traps"],    equipment: ["barbell"],               category: "strength",    difficulty: "intermediate" },
  { name: "Dumbbell Shoulder Press",      nameIt: "Lento avanti con manubri",          muscle: "shoulders",  secondary: ["triceps"],            equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Arnold Press",                 nameIt: "Arnold press",                      muscle: "shoulders",  secondary: ["triceps"],            equipment: ["dumbbell"],              category: "strength",    difficulty: "intermediate" },
  { name: "Lateral Raises",               nameIt: "Alzate laterali",                   muscle: "shoulders",  secondary: [],                     equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Front Raises",                 nameIt: "Alzate frontali",                   muscle: "shoulders",  secondary: [],                     equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Rear Delt Flyes",              nameIt: "Alzate posteriori",                 muscle: "shoulders",  secondary: ["traps"],              equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Cable Lateral Raises",         nameIt: "Alzate laterali ai cavi",           muscle: "shoulders",  secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Cable Front Raises",           nameIt: "Alzate frontali ai cavi",           muscle: "shoulders",  secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Upright Row",                  nameIt: "Rematore verticale",                muscle: "shoulders",  secondary: ["traps","biceps"],     equipment: ["barbell"],               category: "strength",    difficulty: "intermediate" },
  { name: "Machine Shoulder Press",       nameIt: "Spinte con macchina spalle",        muscle: "shoulders",  secondary: ["triceps"],            equipment: ["machine"],               category: "strength",    difficulty: "beginner" },
  { name: "Reverse Pec Deck",             nameIt: "Pec deck inverso",                  muscle: "shoulders",  secondary: ["traps"],              equipment: ["machine"],               category: "strength",    difficulty: "beginner" },
  { name: "Plate Front Raise",            nameIt: "Alzate frontali con disco",         muscle: "shoulders",  secondary: [],                     equipment: ["barbell"],               category: "strength",    difficulty: "beginner" },
  { name: "Pike Push-Up",                 nameIt: "Flessioni a pike",                  muscle: "shoulders",  secondary: ["triceps"],            equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },

  // ── BICIPITI ──────────────────────────────────────────────────────────────
  { name: "Barbell Curl",                 nameIt: "Curl con bilanciere",               muscle: "biceps",     secondary: ["forearms"],           equipment: ["barbell"],               category: "strength",    difficulty: "beginner" },
  { name: "Dumbbell Curl",                nameIt: "Curl con manubri",                  muscle: "biceps",     secondary: ["forearms"],           equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Hammer Curl",                  nameIt: "Curl martello",                     muscle: "biceps",     secondary: ["forearms"],           equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Preacher Curl",                nameIt: "Curl al panchetto Scott",           muscle: "biceps",     secondary: [],                     equipment: ["barbell","machine"],      category: "strength",    difficulty: "beginner" },
  { name: "Cable Curl",                   nameIt: "Curl ai cavi",                      muscle: "biceps",     secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "EZ-Bar Curl",                  nameIt: "Curl con bilanciere EZ",            muscle: "biceps",     secondary: ["forearms"],           equipment: ["ez_bar"],                category: "strength",    difficulty: "beginner" },
  { name: "Concentration Curl",           nameIt: "Curl di concentrazione",            muscle: "biceps",     secondary: [],                     equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Incline Dumbbell Curl",        nameIt: "Curl su panca inclinata",           muscle: "biceps",     secondary: [],                     equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "beginner" },
  { name: "Spider Curl",                  nameIt: "Spider curl",                       muscle: "biceps",     secondary: [],                     equipment: ["barbell"],               category: "strength",    difficulty: "beginner" },
  { name: "Cable Hammer Curl",            nameIt: "Curl martello ai cavi",             muscle: "biceps",     secondary: ["forearms"],           equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Reverse Curl",                 nameIt: "Curl inverso",                      muscle: "forearms",   secondary: ["biceps"],             equipment: ["barbell"],               category: "strength",    difficulty: "beginner" },
  { name: "Wrist Curl",                   nameIt: "Curl polsi",                        muscle: "forearms",   secondary: [],                     equipment: ["barbell"],               category: "strength",    difficulty: "beginner" },

  // ── TRICIPITI ─────────────────────────────────────────────────────────────
  { name: "Triceps Dips",                 nameIt: "Dip ai tricipiti",                  muscle: "triceps",    secondary: ["chest"],              equipment: ["bodyweight"],             category: "strength",    difficulty: "intermediate" },
  { name: "Bench Dips",                   nameIt: "Dip su panca",                      muscle: "triceps",    secondary: [],                     equipment: ["bench"],                  category: "strength",    difficulty: "beginner" },
  { name: "Close Grip Bench Press",       nameIt: "Panca presa stretta",               muscle: "triceps",    secondary: ["chest"],              equipment: ["barbell","bench"],        category: "strength",    difficulty: "intermediate" },
  { name: "Skull Crushers",               nameIt: "Estensioni francesi",               muscle: "triceps",    secondary: [],                     equipment: ["barbell","bench"],        category: "strength",    difficulty: "intermediate" },
  { name: "Triceps Pushdown",             nameIt: "Pushdown ai cavi",                  muscle: "triceps",    secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Rope Pushdown",                nameIt: "Pushdown con fune",                 muscle: "triceps",    secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Overhead Triceps Extension",   nameIt: "Estensioni sopra la testa",         muscle: "triceps",    secondary: [],                     equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Cable Overhead Extension",     nameIt: "Estensioni sopra la testa ai cavi", muscle: "triceps",   secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Kickbacks",                    nameIt: "Kickback tricipiti",                muscle: "triceps",    secondary: [],                     equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Diamond Push-Up",              nameIt: "Flessioni a diamante",              muscle: "triceps",    secondary: ["chest"],              equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "EZ-Bar Skull Crusher",         nameIt: "Estensioni francesi con EZ",        muscle: "triceps",    secondary: [],                     equipment: ["ez_bar","bench"],         category: "strength",    difficulty: "intermediate" },
  { name: "Tate Press",                   nameIt: "Tate press",                        muscle: "triceps",    secondary: [],                     equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "intermediate" },

  // ── GAMBE — COMPOSTI (primary: legs) ──────────────────────────────────────
  // Selezionando "Gambe" si vedono tutti questi
  { name: "Barbell Squat",                nameIt: "Squat con bilanciere",              muscle: "legs",       secondary: ["glutes","hamstrings","core"], equipment: ["barbell"],        category: "strength",    difficulty: "advanced" },
  { name: "Front Squat",                  nameIt: "Squat frontale",                    muscle: "legs",       secondary: ["glutes","core"],      equipment: ["barbell"],               category: "strength",    difficulty: "advanced" },
  { name: "Leg Press",                    nameIt: "Leg press",                         muscle: "legs",       secondary: ["glutes","hamstrings"], equipment: ["machine"],              category: "strength",    difficulty: "beginner" },
  { name: "Hack Squat",                   nameIt: "Hack squat",                        muscle: "legs",       secondary: ["glutes"],             equipment: ["machine"],               category: "strength",    difficulty: "intermediate" },
  { name: "Lunges",                       nameIt: "Affondi",                           muscle: "legs",       secondary: ["glutes","hamstrings"], equipment: ["bodyweight"],           category: "strength",    difficulty: "beginner" },
  { name: "Dumbbell Lunges",              nameIt: "Affondi con manubri",               muscle: "legs",       secondary: ["glutes","hamstrings"], equipment: ["dumbbell"],             category: "strength",    difficulty: "beginner" },
  { name: "Barbell Lunges",               nameIt: "Affondi con bilanciere",            muscle: "legs",       secondary: ["glutes","hamstrings"], equipment: ["barbell"],              category: "strength",    difficulty: "intermediate" },
  { name: "Walking Lunges",               nameIt: "Affondi camminati",                 muscle: "legs",       secondary: ["glutes","hamstrings"], equipment: ["dumbbell"],             category: "strength",    difficulty: "beginner" },
  { name: "Reverse Lunges",               nameIt: "Affondi indietro",                  muscle: "legs",       secondary: ["glutes","hamstrings"], equipment: ["bodyweight"],           category: "strength",    difficulty: "beginner" },
  { name: "Bulgarian Split Squat",        nameIt: "Split squat bulgaro",               muscle: "legs",       secondary: ["glutes"],             equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "intermediate" },
  { name: "Smith Machine Squat",          nameIt: "Squat alla Smith Machine",          muscle: "legs",       secondary: ["glutes"],             equipment: ["smith_machine"],          category: "strength",    difficulty: "beginner" },
  { name: "Goblet Squat",                 nameIt: "Goblet squat",                      muscle: "legs",       secondary: ["glutes","core"],      equipment: ["kettlebell"],             category: "strength",    difficulty: "beginner" },
  { name: "Step Up",                      nameIt: "Step up",                           muscle: "legs",       secondary: ["glutes"],             equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Dumbbell Step Up",             nameIt: "Step up con manubri",               muscle: "legs",       secondary: ["glutes"],             equipment: ["dumbbell"],              category: "strength",    difficulty: "beginner" },
  { name: "Sumo Squat",                   nameIt: "Squat sumo",                        muscle: "legs",       secondary: ["glutes","hamstrings"], equipment: ["dumbbell"],             category: "strength",    difficulty: "beginner" },
  { name: "Box Jump",                     nameIt: "Salto sulla pedana",                muscle: "legs",       secondary: ["cardio"],             equipment: ["bodyweight"],             category: "plyometrics", difficulty: "intermediate" },
  { name: "Jump Squat",                   nameIt: "Squat con salto",                   muscle: "legs",       secondary: ["cardio"],             equipment: ["bodyweight"],             category: "plyometrics", difficulty: "intermediate" },
  { name: "Wall Sit",                     nameIt: "Sit contro il muro",                muscle: "legs",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Sissy Squat",                  nameIt: "Sissy squat",                       muscle: "legs",       secondary: ["quadriceps"],         equipment: ["bodyweight"],             category: "strength",    difficulty: "intermediate" },
  { name: "Leg Press (45°)",              nameIt: "Leg press a 45 gradi",              muscle: "legs",       secondary: ["glutes","hamstrings"], equipment: ["machine"],              category: "strength",    difficulty: "beginner" },
  { name: "Pistol Squat",                 nameIt: "Squat su una gamba",                muscle: "legs",       secondary: ["glutes","core"],      equipment: ["bodyweight"],             category: "strength",    difficulty: "advanced" },

  // ── QUADRICIPITI — isolamento ─────────────────────────────────────────────
  { name: "Leg Extension",                nameIt: "Leg extension",                     muscle: "quadriceps", secondary: [],                     equipment: ["machine"],               category: "strength",    difficulty: "beginner" },
  { name: "Terminal Knee Extension",      nameIt: "Estensione terminale del ginocchio", muscle: "quadriceps", secondary: [],                    equipment: ["resistance_band"],        category: "strength",    difficulty: "beginner" },

  // ── FEMORALI — isolamento ─────────────────────────────────────────────────
  { name: "Leg Curl",                     nameIt: "Leg curl (seduto)",                 muscle: "hamstrings", secondary: [],                     equipment: ["machine"],               category: "strength",    difficulty: "beginner" },
  { name: "Lying Leg Curl",               nameIt: "Leg curl (sdraiato)",               muscle: "hamstrings", secondary: [],                     equipment: ["machine"],               category: "strength",    difficulty: "beginner" },
  { name: "Romanian Deadlift",            nameIt: "Stacco rumeno",                     muscle: "hamstrings", secondary: ["glutes","back"],      equipment: ["barbell"],               category: "strength",    difficulty: "intermediate" },
  { name: "Dumbbell Romanian Deadlift",   nameIt: "Stacco rumeno con manubri",         muscle: "hamstrings", secondary: ["glutes","back"],      equipment: ["dumbbell"],              category: "strength",    difficulty: "intermediate" },
  { name: "Stiff Leg Deadlift",           nameIt: "Stacco gambe tese",                 muscle: "hamstrings", secondary: ["glutes","back"],      equipment: ["barbell"],               category: "strength",    difficulty: "intermediate" },
  { name: "Nordic Curl",                  nameIt: "Curl nordico",                      muscle: "hamstrings", secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "advanced" },
  { name: "Good Morning",                 nameIt: "Good morning",                      muscle: "hamstrings", secondary: ["back","glutes"],      equipment: ["barbell"],               category: "strength",    difficulty: "intermediate" },
  { name: "Single Leg Romanian Deadlift", nameIt: "Stacco rumeno su una gamba",        muscle: "hamstrings", secondary: ["glutes","core"],      equipment: ["dumbbell"],              category: "strength",    difficulty: "intermediate" },

  // ── GLUTEI — isolamento ───────────────────────────────────────────────────
  { name: "Hip Thrust",                   nameIt: "Hip thrust con bilanciere",         muscle: "glutes",     secondary: ["hamstrings"],         equipment: ["barbell","bench"],        category: "strength",    difficulty: "intermediate" },
  { name: "Dumbbell Hip Thrust",          nameIt: "Hip thrust con manubri",            muscle: "glutes",     secondary: ["hamstrings"],         equipment: ["dumbbell","bench"],       category: "strength",    difficulty: "beginner" },
  { name: "Glute Bridge",                 nameIt: "Ponte glutei",                      muscle: "glutes",     secondary: ["hamstrings"],         equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Single Leg Glute Bridge",      nameIt: "Ponte glutei su una gamba",         muscle: "glutes",     secondary: ["hamstrings","core"],  equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Cable Kickbacks",              nameIt: "Kickback glutei ai cavi",           muscle: "glutes",     secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Donkey Kicks",                 nameIt: "Donkey kick",                       muscle: "glutes",     secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Hip Abduction Machine",        nameIt: "Abduttore (macchina)",              muscle: "glutes",     secondary: [],                     equipment: ["machine"],               category: "strength",    difficulty: "beginner" },
  { name: "Banded Clamshell",             nameIt: "Conchiglia con elastico",           muscle: "glutes",     secondary: [],                     equipment: ["resistance_band"],        category: "strength",    difficulty: "beginner" },
  { name: "Frog Pump",                    nameIt: "Frog pump",                         muscle: "glutes",     secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },

  // ── POLPACCI ──────────────────────────────────────────────────────────────
  { name: "Standing Calf Raises",         nameIt: "Calf raises in piedi",              muscle: "calves",     secondary: [],                     equipment: ["machine"],               category: "strength",    difficulty: "beginner" },
  { name: "Seated Calf Raises",           nameIt: "Calf raises seduto",                muscle: "calves",     secondary: [],                     equipment: ["machine"],               category: "strength",    difficulty: "beginner" },
  { name: "Donkey Calf Raises",           nameIt: "Calf raises ciuco",                 muscle: "calves",     secondary: [],                     equipment: ["machine"],               category: "strength",    difficulty: "beginner" },
  { name: "Single Leg Calf Raises",       nameIt: "Calf raises su una gamba",          muscle: "calves",     secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Barbell Calf Raises",          nameIt: "Calf raises con bilanciere",        muscle: "calves",     secondary: [],                     equipment: ["barbell"],               category: "strength",    difficulty: "beginner" },

  // ── CORE / ADDOME ─────────────────────────────────────────────────────────
  { name: "Plank",                        nameIt: "Plank",                             muscle: "core",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Side Plank",                   nameIt: "Plank laterale",                    muscle: "core",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Crunch",                       nameIt: "Crunch",                            muscle: "core",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Bicycle Crunch",               nameIt: "Crunch bicicletta",                 muscle: "core",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Cable Crunch",                 nameIt: "Crunch ai cavi",                    muscle: "core",       secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },
  { name: "Leg Raises",                   nameIt: "Sollevamento gambe",                muscle: "core",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Hanging Leg Raises",           nameIt: "Sollevamento gambe alla sbarra",    muscle: "core",       secondary: [],                     equipment: ["pull_up_bar"],            category: "strength",    difficulty: "intermediate" },
  { name: "Hanging Knee Raises",          nameIt: "Sollevamento ginocchia alla sbarra",muscle: "core",       secondary: [],                     equipment: ["pull_up_bar"],            category: "strength",    difficulty: "beginner" },
  { name: "Ab Wheel Rollout",             nameIt: "Rotella addominali",                muscle: "core",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "intermediate" },
  { name: "Russian Twists",               nameIt: "Russian twist",                     muscle: "core",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Mountain Climbers",            nameIt: "Mountain climbers",                 muscle: "core",       secondary: ["cardio"],             equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "V-Up",                         nameIt: "V-up",                              muscle: "core",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "intermediate" },
  { name: "Dragon Flag",                  nameIt: "Dragon flag",                       muscle: "core",       secondary: [],                     equipment: ["bench"],                  category: "strength",    difficulty: "advanced" },
  { name: "Hollow Body Hold",             nameIt: "Hollow body",                       muscle: "core",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "intermediate" },
  { name: "Dead Bug",                     nameIt: "Dead bug",                          muscle: "core",       secondary: [],                     equipment: ["bodyweight"],             category: "strength",    difficulty: "beginner" },
  { name: "Pallof Press",                 nameIt: "Pallof press",                      muscle: "core",       secondary: [],                     equipment: ["cable"],                  category: "strength",    difficulty: "beginner" },

  // ── CARDIO ────────────────────────────────────────────────────────────────
  { name: "Treadmill Running",            nameIt: "Corsa su tapis roulant",            muscle: "cardio",     secondary: [],                     equipment: ["treadmill"],              category: "cardio",      difficulty: "beginner" },
  { name: "Jumping Jacks",                nameIt: "Jumping jacks",                     muscle: "cardio",     secondary: [],                     equipment: ["bodyweight"],             category: "cardio",      difficulty: "beginner" },
  { name: "Burpees",                      nameIt: "Burpees",                           muscle: "cardio",     secondary: ["core","chest"],       equipment: ["bodyweight"],             category: "cardio",      difficulty: "intermediate" },
  { name: "Jump Rope",                    nameIt: "Corda per saltare",                 muscle: "cardio",     secondary: ["calves"],             equipment: ["bodyweight"],             category: "cardio",      difficulty: "beginner" },
  { name: "High Knees",                   nameIt: "Ginocchia alte",                    muscle: "cardio",     secondary: ["core"],               equipment: ["bodyweight"],             category: "cardio",      difficulty: "beginner" },
  { name: "Battle Ropes",                 nameIt: "Battle ropes",                      muscle: "cardio",     secondary: ["shoulders","core"],   equipment: ["bodyweight"],             category: "cardio",      difficulty: "intermediate" },
  { name: "Rowing Machine",               nameIt: "Vogatore",                          muscle: "cardio",     secondary: ["back","legs"],        equipment: ["machine"],               category: "cardio",      difficulty: "beginner" },
  { name: "Stationary Bike",              nameIt: "Cyclette",                          muscle: "cardio",     secondary: [],                     equipment: ["machine"],               category: "cardio",      difficulty: "beginner" },
];

async function main() {
  console.log("🌱 Avvio seed database...");

  // ── Muscle groups (upsert) ─────────────────────────────────────────────────
  console.log("📦 Sincronizzazione gruppi muscolari...");
  const muscleMap: Record<string, string> = {};
  for (const mg of muscleGroups) {
    const record = await prisma.muscleGroup.upsert({
      where: { name: mg.name },
      update: { nameIt: mg.nameIt },
      create: mg,
    });
    muscleMap[mg.name] = record.id;
  }

  // ── Equipment (upsert) ────────────────────────────────────────────────────
  console.log("🏋️ Sincronizzazione attrezzature...");
  const equipmentMap: Record<string, string> = {};
  for (const eq of equipmentList) {
    const record = await prisma.equipment.upsert({
      where: { name: eq.name },
      update: { nameIt: eq.nameIt },
      create: eq,
    });
    equipmentMap[eq.name] = record.id;
  }

  // ── Exercises: aggiungi solo quelli mancanti (match per name) ─────────────
  console.log("💪 Sincronizzazione esercizi...");
  let added = 0;
  let skipped = 0;

  for (const ex of exercises) {
    const muscleId = muscleMap[ex.muscle];
    if (!muscleId) {
      console.warn(`⚠️  Gruppo muscolare non trovato: ${ex.muscle} per "${ex.name}"`);
      continue;
    }

    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, isCustom: false },
    });

    if (existing) {
      skipped++;
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
            .map((e) => ({ equipment: { connect: { id: equipmentMap[e] } } })),
        },
      },
    });
    added++;
  }

  const total = await prisma.exercise.count({ where: { isCustom: false } });
  console.log(`✅ Esercizi: ${added} aggiunti, ${skipped} già presenti, ${total} totali.`);

  // ── Admin user ────────────────────────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!existing) {
    const hashed = await bcrypt.hash("palestra", 12);
    await prisma.user.create({
      data: { username: "admin", password: hashed, role: "ADMIN" },
    });
    console.log("👤 Admin creato → username: admin / password: palestra");
  } else {
    console.log("👤 Admin già esistente, skip.");
  }

  console.log("✅ Seed completato!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
