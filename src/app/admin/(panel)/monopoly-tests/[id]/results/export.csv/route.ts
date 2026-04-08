import { auth } from "@/auth";
import { FIAT_DENOMINATION_ORDER, fiatDenominationLabel } from "@/lib/monopoly-denomination";
import { prisma } from "@/lib/prisma";
import { FiatDenomination } from "@prisma/client";
import { NextResponse } from "next/server";

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id: exerciseId } = await params;
  const exercise = await prisma.monopolyExercise.findUnique({
    where: { id: exerciseId },
    include: {
      cards: { orderBy: { sortOrder: "asc" } },
      participantSessions: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "asc" },
        include: {
          allocations: { include: { card: true } },
          cardComments: true,
        },
      },
    },
  });

  if (!exercise) {
    return new NextResponse("Not found", { status: 404 });
  }

  const header = ["session_id", "completed_at"];
  for (const d of FIAT_DENOMINATION_ORDER) {
    header.push(`bill_${fiatDenominationLabel(d)}_card_label`);
  }
  if (exercise.allowCardComments) {
    for (const c of exercise.cards) {
      header.push(`comment_${c.id}`);
    }
  }

  const lines = [header.join(",")];

  for (const ps of exercise.participantSessions) {
    const completed = ps.completedAt?.toISOString() ?? "";
    const byDenom = new Map<FiatDenomination, string>();
    for (const a of ps.allocations) {
      byDenom.set(a.denomination, a.card.label);
    }
    const row: string[] = [csvEscape(ps.id), csvEscape(completed)];
    for (const d of FIAT_DENOMINATION_ORDER) {
      row.push(csvEscape(byDenom.get(d) ?? ""));
    }
    if (exercise.allowCardComments) {
      const commentByCard = new Map(ps.cardComments.map((cc) => [cc.cardId, cc.body] as const));
      for (const c of exercise.cards) {
        row.push(csvEscape(commentByCard.get(c.id) ?? ""));
      }
    }
    lines.push(row.join(","));
  }

  const body = lines.join("\r\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="monopoly-value-${exercise.slug}-results.csv"`,
    },
  });
}
