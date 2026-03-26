import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SortBoard } from "./SortBoard";

export default async function SortPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exercise = await prisma.exercise.findFirst({
    where: { slug, isPublished: true },
    include: {
      cards: { orderBy: { sortOrder: "asc" } },
      categoryPresets: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!exercise) notFound();

  const jar = await cookies();
  const sessionId = jar.get(`cs_${exercise.id}`)?.value;
  if (!sessionId) {
    redirect(`/s/${slug}`);
  }

  const session = await prisma.participantSession.findFirst({
    where: { id: sessionId, exerciseId: exercise.id },
  });
  if (!session) {
    redirect(`/s/${slug}`);
  }
  if (session.completedAt) {
    redirect(`/s/${slug}/complete`);
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold">{exercise.name}</h1>
            <p className="text-xs text-neutral-500">Drag cards into categories. Submit when you are done.</p>
          </div>
          <Link href={`/s/${slug}`} className="text-sm text-neutral-600 underline dark:text-neutral-400">
            Back to intro
          </Link>
        </div>
      </header>
      <SortBoard
        slug={slug}
        exerciseType={exercise.type}
        randomizeCards={exercise.randomizeCards}
        requireAllSorted={exercise.requireAllSorted}
        allowDuplicatePlacements={exercise.allowDuplicatePlacements}
        allowCardComments={exercise.allowCardComments}
        cards={exercise.cards.map((c) => ({
          id: c.id,
          label: c.label,
          description: c.description,
        }))}
        presets={exercise.categoryPresets.map((c) => ({
          id: c.id,
          label: c.label,
          description: c.description,
        }))}
      />
    </div>
  );
}
