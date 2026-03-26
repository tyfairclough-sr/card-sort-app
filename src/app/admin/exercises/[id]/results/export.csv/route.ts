import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      participantSessions: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "asc" },
        include: {
          placements: {
            include: {
              card: true,
              categoryPreset: true,
              participantCategory: true,
            },
          },
        },
      },
    },
  });

  if (!exercise) {
    return new NextResponse("Not found", { status: 404 });
  }

  const header = [
    "session_id",
    "completed_at",
    "card_label",
    "category_label",
    "category_kind",
    "comment",
  ];

  const lines = [header.join(",")];

  for (const ps of exercise.participantSessions) {
    const completed = ps.completedAt?.toISOString() ?? "";
    for (const pl of ps.placements) {
      const categoryLabel =
        pl.categoryPreset?.label ?? pl.participantCategory?.label ?? "";
      const kind = pl.categoryPreset ? "preset" : "participant";
      const row = [
        csvEscape(ps.id),
        csvEscape(completed),
        csvEscape(pl.card.label),
        csvEscape(categoryLabel),
        csvEscape(kind),
        csvEscape(pl.comment ?? ""),
      ];
      lines.push(row.join(","));
    }
  }

  const body = lines.join("\r\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="card-sort-${exercise.slug}-results.csv"`,
    },
  });
}
