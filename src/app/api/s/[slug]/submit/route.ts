import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  submitBodySchema,
  validateAllCardsPlaced,
  validatePlacementsForExercise,
} from "@/lib/participant-submit";
import { rateLimit } from "@/lib/rate-limit";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ip = clientIp(request);
  const limited = rateLimit(`submit:${ip}`);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const exercise = await prisma.exercise.findFirst({
    where: { slug, isPublished: true },
    include: { cards: true, categoryPresets: true },
  });
  if (!exercise) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const jar = await cookies();
  const sessionId = jar.get(`cs_${exercise.id}`)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const participantSession = await prisma.participantSession.findFirst({
    where: { id: sessionId, exerciseId: exercise.id },
  });
  if (!participantSession) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  if (participantSession.completedAt) {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submitBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  if (body.placements.length === 0 && exercise.requireAllSorted) {
    return NextResponse.json({ error: "Add at least one placement before submitting." }, { status: 400 });
  }

  const typeRules = validatePlacementsForExercise(exercise.type, body.placements);
  if (!typeRules.ok) {
    return NextResponse.json({ error: typeRules.message }, { status: 400 });
  }

  const presetIds = new Set(exercise.categoryPresets.map((c) => c.id));
  const cardIds = new Set(exercise.cards.map((c) => c.id));

  for (const p of body.placements) {
    if (!cardIds.has(p.cardId)) {
      return NextResponse.json({ error: "Unknown card" }, { status: 400 });
    }
    if (p.presetId) {
      if (!presetIds.has(p.presetId)) {
        return NextResponse.json({ error: "Unknown category" }, { status: 400 });
      }
    }
  }

  if (exercise.requireAllSorted) {
    const allPlaced = validateAllCardsPlaced(
      exercise.cards.map((c) => c.id),
      body.placements,
      exercise.allowDuplicatePlacements,
    );
    if (!allPlaced.ok) {
      return NextResponse.json({ error: allPlaced.message }, { status: 400 });
    }
  }

  const keys = new Set(body.participantCategories.map((c) => c.clientKey));
  for (const p of body.placements) {
    if (p.participantCategoryKey && !keys.has(p.participantCategoryKey)) {
      return NextResponse.json({ error: "Unknown participant category key" }, { status: 400 });
    }
  }

  for (const p of body.placements) {
    if (p.comment && !exercise.allowCardComments) {
      return NextResponse.json({ error: "Comments are disabled for this study." }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.placement.deleteMany({ where: { participantSessionId: participantSession.id } });
    await tx.participantCategory.deleteMany({ where: { participantSessionId: participantSession.id } });

    const ordered = [...body.participantCategories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const keyToId = new Map<string, string>();
    for (let i = 0; i < ordered.length; i++) {
      const row = ordered[i];
      const created = await tx.participantCategory.create({
        data: {
          participantSessionId: participantSession.id,
          label: row.label,
          description: row.description ?? null,
          sortOrder: row.sortOrder ?? i,
        },
      });
      keyToId.set(row.clientKey, created.id);
    }

    for (const p of body.placements) {
      await tx.placement.create({
        data: {
          participantSessionId: participantSession.id,
          cardId: p.cardId,
          categoryPresetId: p.presetId ?? null,
          participantCategoryId: p.participantCategoryKey
            ? (keyToId.get(p.participantCategoryKey) ?? null)
            : null,
          comment: exercise.allowCardComments ? (p.comment?.trim() || null) : null,
        },
      });
    }

    await tx.participantSession.update({
      where: { id: participantSession.id },
      data: { completedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true });
}
