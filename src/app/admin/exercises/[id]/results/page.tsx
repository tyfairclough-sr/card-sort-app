import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      participantSessions: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        include: {
          _count: { select: { placements: true } },
        },
      },
    },
  });
  if (!exercise) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={`/admin/exercises/${id}`} className="text-sm text-neutral-600 hover:underline dark:text-neutral-400">
            ← {exercise.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Results</h1>
          <p className="text-sm text-neutral-500">
            {exercise.participantSessions.length} completed session
            {exercise.participantSessions.length === 1 ? "" : "s"}
          </p>
        </div>
        <a
          href={`/admin/exercises/${id}/results/export.csv`}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Download CSV
        </a>
      </div>

      {exercise.participantSessions.length === 0 ? (
        <p className="text-neutral-600 dark:text-neutral-400">No completed sessions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
              <tr>
                <th className="px-4 py-2 font-medium">Session</th>
                <th className="px-4 py-2 font-medium">Completed</th>
                <th className="px-4 py-2 font-medium">Placements</th>
              </tr>
            </thead>
            <tbody>
              {exercise.participantSessions.map((s) => (
                <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-4 py-2 font-mono text-xs">{s.id}</td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                    {s.completedAt?.toISOString() ?? "—"}
                  </td>
                  <td className="px-4 py-2">{s._count.placements}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
