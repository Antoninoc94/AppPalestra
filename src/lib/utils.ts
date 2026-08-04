import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatWeight(weight: number | null | undefined): string {
  if (!weight) return "—";
  return `${weight} kg`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}

export function getGoalLabel(goal: string): string {
  const labels: Record<string, string> = {
    strength: "Forza",
    hypertrophy: "Ipertrofia",
    endurance: "Resistenza",
    weight_loss: "Dimagrimento",
    general: "Generale",
  };
  return labels[goal] ?? goal;
}

export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzato",
  };
  return labels[difficulty] ?? difficulty;
}
