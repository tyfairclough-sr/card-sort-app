import { z } from "zod";
import { showPresetCategories } from "@/lib/exercise-rules";
import type { Card, CategoryPreset, Exercise, ExerciseType } from "@prisma/client";

export const CARD_SORT_EXPORT_FORMAT = "card-sort-app" as const;
export const CARD_SORT_EXPORT_VERSION = 1 as const;

const exerciseTypeSchema = z.enum(["closed", "open", "hybrid"]);

const cardExportSchema = z.object({
  label: z.string().min(1).max(500),
  description: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

const categoryPresetExportSchema = z.object({
  label: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const exportedExerciseSchema = z.object({
  name: z.string().min(1).max(200),
  type: exerciseTypeSchema,
  welcomeContent: z.string().max(50_000).default(""),
  completionContent: z.string().max(50_000).default(""),
  randomizeCards: z.boolean().default(false),
  requireAllSorted: z.boolean().default(true),
  allowDuplicatePlacements: z.boolean().default(false),
  allowCardComments: z.boolean().default(false),
  cards: z.array(cardExportSchema).default([]),
  categoryPresets: z.array(categoryPresetExportSchema).default([]),
});

export type ExportedExercise = z.infer<typeof exportedExerciseSchema>;

export const cardSortExportFileSchema = z.object({
  format: z.literal(CARD_SORT_EXPORT_FORMAT),
  version: z.literal(CARD_SORT_EXPORT_VERSION),
  exportedAt: z.string().optional(),
  exercise: exportedExerciseSchema,
});

export type CardSortExportFile = z.infer<typeof cardSortExportFileSchema>;

export type ExerciseWithExportRelations = Exercise & {
  cards: Card[];
  categoryPresets: CategoryPreset[];
};

export function buildCardSortExportDocument(exercise: ExerciseWithExportRelations): CardSortExportFile {
  return {
    format: CARD_SORT_EXPORT_FORMAT,
    version: CARD_SORT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    exercise: {
      name: exercise.name,
      type: exercise.type as ExerciseType,
      welcomeContent: exercise.welcomeContent,
      completionContent: exercise.completionContent,
      randomizeCards: exercise.randomizeCards,
      requireAllSorted: exercise.requireAllSorted,
      allowDuplicatePlacements: exercise.allowDuplicatePlacements,
      allowCardComments: exercise.allowCardComments,
      cards: exercise.cards.map((c) => ({
        label: c.label,
        description: c.description,
        sortOrder: c.sortOrder,
      })),
      categoryPresets: exercise.categoryPresets.map((p) => ({
        label: p.label,
        description: p.description,
        sortOrder: p.sortOrder,
      })),
    },
  };
}

export function parseCardSortExportFile(raw: unknown) {
  return cardSortExportFileSchema.safeParse(raw);
}

export function categoryPresetsToImport(
  type: ExerciseType,
  presets: ExportedExercise["categoryPresets"],
): { label: string; description: string | null; sortOrder: number }[] {
  if (!showPresetCategories(type)) return [];
  return presets.map((p, index) => ({
    label: p.label,
    description: p.description ?? null,
    sortOrder: p.sortOrder ?? index,
  }));
}
