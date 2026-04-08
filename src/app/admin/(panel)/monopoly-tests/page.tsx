import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function MonopolyTestsPage() {
  const exercises = await prisma.monopolyExercise.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { cards: true, participantSessions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Monopoly value tests</h1>
        <Link
          href="/admin/monopoly-tests/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          New test
        </Link>
      </div>
      {exercises.length === 0 ? (
        <p className="text-neutral-600 dark:text-neutral-400">No tests yet. Create one to get started.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          {exercises.map((ex) => (
            <li key={ex.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <Link href={`/admin/monopoly-tests/${ex.id}`} className="font-medium hover:underline">
                  {ex.name}
                </Link>
                <p className="text-sm text-neutral-500">
                  /m/{ex.slug} · {ex.isPublished ? "Published" : "Draft"}
                </p>
                <p className="text-xs text-neutral-400">
                  {ex._count.cards} cards · {ex._count.participantSessions} sessions
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <Link
                  href={`/admin/monopoly-tests/${ex.id}/results`}
                  className="text-neutral-600 hover:underline dark:text-neutral-300"
                >
                  Results
                </Link>
                {ex.isPublished ? (
                  <Link
                    href={`/m/${ex.slug}`}
                    className="text-neutral-600 hover:underline dark:text-neutral-300"
                    target="_blank"
                  >
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
