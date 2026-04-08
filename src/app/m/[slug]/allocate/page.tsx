import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { MonopolyBoard } from "./MonopolyBoard";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function MonopolyAllocatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exercise = await prisma.monopolyExercise.findFirst({
    where: { slug, isPublished: true },
    include: {
      cards: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!exercise) notFound();

  const jar = await cookies();
  const sessionId = jar.get(`mv_${exercise.id}`)?.value;
  if (!sessionId) {
    redirect(`/m/${slug}`);
  }

  const session = await prisma.monopolyParticipantSession.findFirst({
    where: { id: sessionId, exerciseId: exercise.id },
  });
  if (!session) {
    redirect(`/m/${slug}`);
  }
  if (session.completedAt) {
    redirect(`/m/${slug}/complete`);
  }

  const orderedCards = exercise.randomizeCards ? shuffle(exercise.cards) : exercise.cards;

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold">{exercise.name}</h1>
            <p className="text-xs text-neutral-500">
              Drag each bill onto the cards you value most. Return a bill to the dashed area to unplace it.
            </p>
          </div>
          <Link href={`/m/${slug}`} className="text-sm text-neutral-600 underline dark:text-neutral-400">
            Back to intro
          </Link>
        </div>
      </header>
      <MonopolyBoard
        slug={slug}
        requireAllFiatSpent={exercise.requireAllFiatSpent}
        allowMultipleDenominationsPerCard={exercise.allowMultipleDenominationsPerCard}
        allowCardComments={exercise.allowCardComments}
        cards={orderedCards.map((c) => ({
          id: c.id,
          label: c.label,
          description: c.description,
        }))}
      />
    </div>
  );
}
