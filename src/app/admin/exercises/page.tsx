import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ExercisesPage() {
  const exercises = await prisma.exercise.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { cards: true, categoryPresets: true, participantSessions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Card sort exercises</h1>
        <Link
          href="/admin/exercises/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          New exercise
        </Link>
      </div>
      {exercises.length === 0 ? (
        <p className="text-neutral-600 dark:text-neutral-400">No exercises yet. Create one to get started.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          {exercises.map((ex) => (
            <li key={ex.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <Link href={`/admin/exercises/${ex.id}`} className="font-medium hover:underline">
                  {ex.name}
                </Link>
                <p className="text-sm text-neutral-500">
                  /s/{ex.slug} · {ex.type} · {ex.isPublished ? "Published" : "Draft"}
                </p>
                <p className="text-xs text-neutral-400">
                  {ex._count.cards} cards · {ex._count.categoryPresets} preset categories ·{" "}
                  {ex._count.participantSessions} sessions
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <Link href={`/admin/exercises/${ex.id}/results`} className="text-neutral-600 hover:underline dark:text-neutral-300">
                  Results
                </Link>
                {ex.isPublished ? (
                  <Link href={`/s/${ex.slug}`} className="text-neutral-600 hover:underline dark:text-neutral-300" target="_blank">
                    Open
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
