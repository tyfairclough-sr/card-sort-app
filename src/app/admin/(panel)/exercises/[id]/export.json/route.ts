import { auth } from "@/auth";
import { buildCardSortExportDocument } from "@/lib/card-sort-export";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
      cards: { orderBy: { sortOrder: "asc" } },
      categoryPresets: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!exercise) {
    return new NextResponse("Not found", { status: 404 });
  }

  const doc = buildCardSortExportDocument(exercise);
  const body = JSON.stringify(doc, null, 2);
  const filename = `research-app-${exercise.slug}-config.json`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
