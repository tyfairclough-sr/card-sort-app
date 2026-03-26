"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canPublishExercise } from "@/lib/exercise-rules";
import { isValidSlug } from "@/lib/slug";
import { ExerciseType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

const exerciseTypeSchema = z.enum(["closed", "open", "hybrid"]);

const metaSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(120),
  type: exerciseTypeSchema,
  welcomeContent: z.string().max(50_000).optional().default(""),
  completionContent: z.string().max(50_000).optional().default(""),
  randomizeCards: z.coerce.boolean().optional().default(false),
  requireAllSorted: z.coerce.boolean().optional().default(true),
  allowDuplicatePlacements: z.coerce.boolean().optional().default(false),
  allowCardComments: z.coerce.boolean().optional().default(false),
  isPublished: z.coerce.boolean().optional().default(false),
});

export async function createExercise(formData: FormData): Promise<void> {
  await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = metaSchema.safeParse({
    ...raw,
    randomizeCards: raw.randomizeCards === "on" || raw.randomizeCards === "true",
    requireAllSorted: raw.requireAllSorted === "on" || raw.requireAllSorted === "true",
    allowDuplicatePlacements:
      raw.allowDuplicatePlacements === "on" || raw.allowDuplicatePlacements === "true",
    allowCardComments: raw.allowCardComments === "on" || raw.allowCardComments === "true",
    isPublished: false,
  });
  if (!parsed.success) return;
  const v = parsed.data;
  if (!isValidSlug(v.slug)) return;

  const ex = await prisma.exercise.create({
    data: {
      name: v.name,
      slug: v.slug,
      type: v.type as ExerciseType,
      welcomeContent: v.welcomeContent,
      completionContent: v.completionContent,
      randomizeCards: v.randomizeCards,
      requireAllSorted: v.requireAllSorted,
      allowDuplicatePlacements: v.allowDuplicatePlacements,
      allowCardComments: v.allowCardComments,
      isPublished: false,
    },
  });
  revalidatePath("/admin/exercises");
  redirect(`/admin/exercises/${ex.id}`);
}

export async function updateExerciseMeta(exerciseId: string, formData: FormData): Promise<void> {
  await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = metaSchema.safeParse({
    ...raw,
    randomizeCards: raw.randomizeCards === "on" || raw.randomizeCards === "true",
    requireAllSorted: raw.requireAllSorted === "on" || raw.requireAllSorted === "true",
    allowDuplicatePlacements:
      raw.allowDuplicatePlacements === "on" || raw.allowDuplicatePlacements === "true",
    allowCardComments: raw.allowCardComments === "on" || raw.allowCardComments === "true",
    isPublished: raw.isPublished === "on" || raw.isPublished === "true",
  });
  if (!parsed.success) return;
  const v = parsed.data;
  if (!isValidSlug(v.slug)) return;

  const existing = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { _count: { select: { cards: true, categoryPresets: true } } },
  });
  if (!existing) return;

  const merged = {
    ...existing,
    ...v,
    _count: existing._count,
  };
  if (v.isPublished) {
    const pub = canPublishExercise(merged);
    if (!pub.ok) return;
  }

  await prisma.exercise.update({
    where: { id: exerciseId },
    data: {
      name: v.name,
      slug: v.slug,
      type: v.type as ExerciseType,
      welcomeContent: v.welcomeContent,
      completionContent: v.completionContent,
      randomizeCards: v.randomizeCards,
      requireAllSorted: v.requireAllSorted,
      allowDuplicatePlacements: v.allowDuplicatePlacements,
      allowCardComments: v.allowCardComments,
      isPublished: v.isPublished,
    },
  });
  revalidatePath("/admin/exercises");
  revalidatePath(`/admin/exercises/${exerciseId}`);
  revalidatePath(`/s/${v.slug}`);
}

export async function deleteExercise(exerciseId: string) {
  await requireUser();
  await prisma.exercise.delete({ where: { id: exerciseId } });
  revalidatePath("/admin/exercises");
  redirect("/admin/exercises");
}

const cardSchema = z.object({
  label: z.string().min(1).max(500),
  description: z.string().max(2000).optional().default(""),
});

export async function addCard(exerciseId: string, formData: FormData): Promise<void> {
  await requireUser();
  const parsed = cardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const maxOrder = await prisma.card.aggregate({
    where: { exerciseId },
    _max: { sortOrder: true },
  });
  await prisma.card.create({
    data: {
      exerciseId,
      label: parsed.data.label,
      description: parsed.data.description || null,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath(`/admin/exercises/${exerciseId}`);
}

export async function updateCard(cardId: string, exerciseId: string, formData: FormData): Promise<void> {
  await requireUser();
  const parsed = cardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.card.update({
    where: { id: cardId },
    data: {
      label: parsed.data.label,
      description: parsed.data.description || null,
    },
  });
  revalidatePath(`/admin/exercises/${exerciseId}`);
}

export async function deleteCard(cardId: string, exerciseId: string) {
  await requireUser();
  await prisma.card.delete({ where: { id: cardId } });
  revalidatePath(`/admin/exercises/${exerciseId}`);
}

export async function duplicateCard(cardId: string, exerciseId: string) {
  await requireUser();
  const card = await prisma.card.findFirst({ where: { id: cardId, exerciseId } });
  if (!card) return;
  const maxOrder = await prisma.card.aggregate({
    where: { exerciseId },
    _max: { sortOrder: true },
  });
  await prisma.card.create({
    data: {
      exerciseId,
      label: card.label,
      description: card.description,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath(`/admin/exercises/${exerciseId}`);
}

const catSchema = z.object({
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
});

export async function addCategoryPreset(exerciseId: string, formData: FormData): Promise<void> {
  await requireUser();
  const parsed = catSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const maxOrder = await prisma.categoryPreset.aggregate({
    where: { exerciseId },
    _max: { sortOrder: true },
  });
  await prisma.categoryPreset.create({
    data: {
      exerciseId,
      label: parsed.data.label,
      description: parsed.data.description || null,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath(`/admin/exercises/${exerciseId}`);
}

export async function updateCategoryPreset(presetId: string, exerciseId: string, formData: FormData): Promise<void> {
  await requireUser();
  const parsed = catSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.categoryPreset.update({
    where: { id: presetId },
    data: {
      label: parsed.data.label,
      description: parsed.data.description || null,
    },
  });
  revalidatePath(`/admin/exercises/${exerciseId}`);
}

export async function deleteCategoryPreset(presetId: string, exerciseId: string) {
  await requireUser();
  await prisma.categoryPreset.delete({ where: { id: presetId } });
  revalidatePath(`/admin/exercises/${exerciseId}`);
}
