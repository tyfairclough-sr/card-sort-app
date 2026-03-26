import type { ExerciseType } from "@prisma/client";
import { z } from "zod";
import { allowParticipantNewCategories, showPresetCategories } from "@/lib/exercise-rules";

const newCategorySchema = z.object({
  clientKey: z.string().min(1).max(80),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

const placementSchema = z.object({
  cardId: z.string().min(1),
  presetId: z.string().optional().nullable(),
  participantCategoryKey: z.string().optional().nullable(),
  comment: z.string().max(10_000).optional().nullable(),
});

export const submitBodySchema = z.object({
  participantCategories: z.array(newCategorySchema).optional().default([]),
  placements: z.array(placementSchema).default([]),
});

export type SubmitBody = z.infer<typeof submitBodySchema>;

function oneCategoryRef(p: z.infer<typeof placementSchema>): boolean {
  const hasP = Boolean(p.presetId);
  const hasN = Boolean(p.participantCategoryKey);
  return hasP !== hasN;
}

export function validatePlacementsForExercise(
  type: ExerciseType,
  placements: z.infer<typeof submitBodySchema>["placements"],
): { ok: true } | { ok: false; message: string } {
  for (const p of placements) {
    if (!oneCategoryRef(p)) {
      return { ok: false, message: "Each placement must reference exactly one category." };
    }
    if (type === "closed") {
      if (!p.presetId || p.participantCategoryKey) {
        return { ok: false, message: "Closed sorts only use preset categories." };
      }
    } else if (type === "open") {
      if (p.presetId || !p.participantCategoryKey) {
        return { ok: false, message: "Open sorts only use participant-created categories." };
      }
    } else {
      if (p.presetId && !showPresetCategories(type)) {
        return { ok: false, message: "Preset categories are not allowed for this exercise type." };
      }
      if (p.participantCategoryKey && !allowParticipantNewCategories(type)) {
        return { ok: false, message: "Participant categories are not allowed for this exercise type." };
      }
    }
  }
  return { ok: true };
}

export function validateAllCardsPlaced(
  cardIds: string[],
  placements: z.infer<typeof submitBodySchema>["placements"],
  allowDuplicatePlacements: boolean,
): { ok: true } | { ok: false; message: string } {
  const set = new Set(placements.map((p) => p.cardId));
  for (const id of cardIds) {
    if (!set.has(id)) {
      return { ok: false, message: "Sort every card before submitting." };
    }
  }
  if (!allowDuplicatePlacements) {
    const seen = new Set<string>();
    for (const p of placements) {
      if (seen.has(p.cardId)) {
        return { ok: false, message: "This study does not allow the same card in multiple categories." };
      }
      seen.add(p.cardId);
    }
  }
  return { ok: true };
}
