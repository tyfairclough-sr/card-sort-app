"use server";

import { auth } from "@/auth";
import { canPublishMonopolyExercise } from "@/lib/monopoly-rules";
import { prisma } from "@/lib/prisma";
import { isValidSlug } from "@/lib/slug";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

const metaSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(120),
  welcomeContent: z.string().max(50_000).optional().default(""),
  completionContent: z.string().max(50_000).optional().default(""),
  randomizeCards: z.coerce.boolean().optional().default(false),
  requireAllFiatSpent: z.coerce.boolean().optional().default(false),
  allowMultipleDenominationsPerCard: z.coerce.boolean().optional().default(false),
  allowCardComments: z.coerce.boolean().optional().default(false),
  isPublished: z.coerce.boolean().optional().default(false),
});

export async function createMonopolyExercise(formData: FormData): Promise<void> {
  await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = metaSchema.safeParse({
    ...raw,
    randomizeCards: raw.randomizeCards === "on" || raw.randomizeCards === "true",
    requireAllFiatSpent: raw.requireAllFiatSpent === "on" || raw.requireAllFiatSpent === "true",
    allowMultipleDenominationsPerCard:
      raw.allowMultipleDenominationsPerCard === "on" || raw.allowMultipleDenominationsPerCard === "true",
    allowCardComments: raw.allowCardComments === "on" || raw.allowCardComments === "true",
    isPublished: false,
  });
  if (!parsed.success) return;
  const v = parsed.data;
  if (!isValidSlug(v.slug)) return;

  const ex = await prisma.monopolyExercise.create({
    data: {
      name: v.name,
      slug: v.slug,
      welcomeContent: v.welcomeContent,
      completionContent: v.completionContent,
      randomizeCards: v.randomizeCards,
      requireAllFiatSpent: v.requireAllFiatSpent,
      allowMultipleDenominationsPerCard: v.allowMultipleDenominationsPerCard,
      allowCardComments: v.allowCardComments,
      isPublished: false,
    },
  });
  revalidatePath("/admin/monopoly-tests");
  redirect(`/admin/monopoly-tests/${ex.id}`);
}

export async function updateMonopolyExerciseMeta(exerciseId: string, formData: FormData): Promise<void> {
  await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = metaSchema.safeParse({
    ...raw,
    randomizeCards: raw.randomizeCards === "on" || raw.randomizeCards === "true",
    requireAllFiatSpent: raw.requireAllFiatSpent === "on" || raw.requireAllFiatSpent === "true",
    allowMultipleDenominationsPerCard:
      raw.allowMultipleDenominationsPerCard === "on" || raw.allowMultipleDenominationsPerCard === "true",
    allowCardComments: raw.allowCardComments === "on" || raw.allowCardComments === "true",
    isPublished: raw.isPublished === "on" || raw.isPublished === "true",
  });
  if (!parsed.success) return;
  const v = parsed.data;
  if (!isValidSlug(v.slug)) return;

  const existing = await prisma.monopolyExercise.findUnique({
    where: { id: exerciseId },
    include: { _count: { select: { cards: true } } },
  });
  if (!existing) return;

  const merged = { ...existing, ...v, _count: existing._count };
  if (v.isPublished) {
    const pub = canPublishMonopolyExercise(merged);
    if (!pub.ok) return;
  }

  await prisma.monopolyExercise.update({
    where: { id: exerciseId },
    data: {
      name: v.name,
      slug: v.slug,
      welcomeContent: v.welcomeContent,
      completionContent: v.completionContent,
      randomizeCards: v.randomizeCards,
      requireAllFiatSpent: v.requireAllFiatSpent,
      allowMultipleDenominationsPerCard: v.allowMultipleDenominationsPerCard,
      allowCardComments: v.allowCardComments,
      isPublished: v.isPublished,
    },
  });
  revalidatePath("/admin/monopoly-tests");
  revalidatePath(`/admin/monopoly-tests/${exerciseId}`);
  revalidatePath(`/m/${v.slug}`);
}

export async function deleteMonopolyExercise(exerciseId: string) {
  await requireUser();
  await prisma.monopolyExercise.delete({ where: { id: exerciseId } });
  revalidatePath("/admin/monopoly-tests");
  redirect("/admin/monopoly-tests");
}

const cardSchema = z.object({
  label: z.string().min(1).max(500),
  description: z.string().max(2000).optional().default(""),
});

export async function addMonopolyCard(exerciseId: string, formData: FormData): Promise<void> {
  await requireUser();
  const parsed = cardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const maxOrder = await prisma.monopolyCard.aggregate({
    where: { exerciseId },
    _max: { sortOrder: true },
  });
  await prisma.monopolyCard.create({
    data: {
      exerciseId,
      label: parsed.data.label,
      description: parsed.data.description || null,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath(`/admin/monopoly-tests/${exerciseId}`);
}

export async function updateMonopolyCard(cardId: string, exerciseId: string, formData: FormData): Promise<void> {
  await requireUser();
  const parsed = cardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.monopolyCard.update({
    where: { id: cardId },
    data: {
      label: parsed.data.label,
      description: parsed.data.description || null,
    },
  });
  revalidatePath(`/admin/monopoly-tests/${exerciseId}`);
}

export async function deleteMonopolyCard(cardId: string, exerciseId: string) {
  await requireUser();
  await prisma.monopolyCard.delete({ where: { id: cardId } });
  revalidatePath(`/admin/monopoly-tests/${exerciseId}`);
}

export async function duplicateMonopolyCard(cardId: string, exerciseId: string) {
  await requireUser();
  const card = await prisma.monopolyCard.findFirst({ where: { id: cardId, exerciseId } });
  if (!card) return;
  const maxOrder = await prisma.monopolyCard.aggregate({
    where: { exerciseId },
    _max: { sortOrder: true },
  });
  await prisma.monopolyCard.create({
    data: {
      exerciseId,
      label: card.label,
      description: card.description,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath(`/admin/monopoly-tests/${exerciseId}`);
}
