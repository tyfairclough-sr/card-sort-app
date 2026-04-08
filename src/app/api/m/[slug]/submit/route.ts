import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monopolySubmitBodySchema, validateMonopolySubmit } from "@/lib/monopoly-submit";
import { rateLimit } from "@/lib/rate-limit";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ip = clientIp(request);
  const limited = rateLimit(`m-submit:${ip}`);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const exercise = await prisma.monopolyExercise.findFirst({
    where: { slug, isPublished: true },
    include: { cards: true },
  });
  if (!exercise) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const jar = await cookies();
  const sessionId = jar.get(`mv_${exercise.id}`)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const participantSession = await prisma.monopolyParticipantSession.findFirst({
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

  const parsed = monopolySubmitBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const cardIds = new Set(exercise.cards.map((c) => c.id));
  const validated = validateMonopolySubmit(parsed.data, {
    cardIds,
    requireAllFiatSpent: exercise.requireAllFiatSpent,
    allowMultipleDenominationsPerCard: exercise.allowMultipleDenominationsPerCard,
    allowCardComments: exercise.allowCardComments,
  });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.message }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.monopolyAllocation.deleteMany({ where: { participantSessionId: participantSession.id } });
    await tx.monopolyParticipantCardComment.deleteMany({
      where: { participantSessionId: participantSession.id },
    });

    for (const a of validated.allocations) {
      await tx.monopolyAllocation.create({
        data: {
          participantSessionId: participantSession.id,
          cardId: a.cardId,
          denomination: a.denomination,
        },
      });
    }

    for (const [cardId, body] of validated.comments) {
      await tx.monopolyParticipantCardComment.create({
        data: {
          participantSessionId: participantSession.id,
          cardId,
          body,
        },
      });
    }

    await tx.monopolyParticipantSession.update({
      where: { id: participantSession.id },
      data: { completedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true });
}
