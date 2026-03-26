import type { Exercise, ExerciseType } from "@prisma/client";

export type ExerciseWithCounts = Exercise & {
  _count: { cards: number; categoryPresets: number };
};

export function canPublishExercise(
  ex: ExerciseWithCounts,
): { ok: true } | { ok: false; reason: string } {
  if (ex._count.cards < 1) {
    return { ok: false, reason: "Add at least one card before publishing." };
  }
  if (ex.type === "closed" && ex._count.categoryPresets < 1) {
    return { ok: false, reason: "Closed card sorts need at least one category." };
  }
  return { ok: true };
}

export function showPresetCategories(type: ExerciseType): boolean {
  return type === "closed" || type === "hybrid";
}

export function allowParticipantNewCategories(type: ExerciseType): boolean {
  return type === "open" || type === "hybrid";
}
