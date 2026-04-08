import type { MonopolyExercise } from "@prisma/client";

export type MonopolyExerciseWithCounts = MonopolyExercise & {
  _count: { cards: number };
};

export function canPublishMonopolyExercise(
  ex: MonopolyExerciseWithCounts,
): { ok: true } | { ok: false; reason: string } {
  if (ex._count.cards < 1) {
    return { ok: false, reason: "Add at least one card before publishing." };
  }
  return { ok: true };
}
