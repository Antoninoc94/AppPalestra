export type Goal = "strength" | "hypertrophy" | "endurance" | "weight_loss" | "general";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Category = "strength" | "cardio" | "stretching" | "plyometrics" | "powerlifting" | "olympic_weightlifting";

export interface MuscleGroupWithCount {
  id: string;
  name: string;
  nameIt: string;
  _count: { exercises: number };
}

export interface ExerciseWithRelations {
  id: string;
  name: string;
  nameIt: string | null;
  description: string | null;
  primaryMuscle: { id: string; name: string; nameIt: string };
  secondaryMuscles: string[];
  equipment: Array<{ equipment: { id: string; name: string; nameIt: string } }>;
  category: string;
  difficulty: string;
  isCustom: boolean;
}

export interface ProgramWithDays {
  id: string;
  name: string;
  description: string | null;
  goal: string;
  isActive: boolean;
  days: ProgramDayWithExercises[];
  createdAt: Date;
}

export interface ProgramDayWithExercises {
  id: string;
  name: string;
  dayNumber: number;
  exercises: ProgramExerciseWithDetails[];
}

export interface ProgramExerciseWithDetails {
  id: string;
  order: number;
  sets: number;
  reps: string;
  restSeconds: number;
  weight: number | null;
  notes: string | null;
  exercise: ExerciseWithRelations;
}

export interface WorkoutSessionWithSets {
  id: string;
  date: Date;
  duration: number | null;
  notes: string | null;
  program: { id: string; name: string } | null;
  programDay: { id: string; name: string } | null;
  sets: WorkoutSetWithExercise[];
}

export interface WorkoutSetWithExercise {
  id: string;
  setNumber: number;
  reps: number;
  weight: number | null;
  restSeconds: number | null;
  notes: string | null;
  completedAt: Date;
  exercise: { id: string; name: string; nameIt: string | null };
}

export interface ActiveWorkout {
  sessionId: string;
  programId?: string;
  programDayId?: string;
  exercises: ActiveExercise[];
  startedAt: Date;
}

export interface ActiveExercise {
  exerciseId: string;
  exerciseName: string;
  sets: ActiveSet[];
  targetSets: number;
  targetReps: string;
  targetWeight?: number;
  restSeconds: number;
}

export interface ActiveSet {
  setNumber: number;
  reps: number;
  weight: number | null;
  completed: boolean;
  completedAt?: Date;
}

export interface GenerateWorkoutParams {
  muscleGroups: string[];
  goal: Goal;
  durationMinutes: number;
  difficulty: Difficulty;
  equipmentIds: string[];
}
