import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canPublishMonopolyExercise } from "@/lib/monopoly-rules";
import {
  addMonopolyCard,
  duplicateMonopolyCard,
  deleteMonopolyCard,
  updateMonopolyCard,
  updateMonopolyExerciseMeta,
} from "../actions";
import { DeleteMonopolyExerciseForm } from "./DeleteMonopolyExerciseForm";

export default async function EditMonopolyTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = await prisma.monopolyExercise.findUnique({
    where: { id },
    include: {
      cards: { orderBy: { sortOrder: "asc" } },
      _count: { select: { cards: true } },
    },
  });
  if (!exercise) notFound();

  const publishCheck = canPublishMonopolyExercise(exercise);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/monopoly-tests" className="text-sm text-neutral-600 hover:underline dark:text-neutral-400">
            ← All Monopoly value tests
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{exercise.name}</h1>
          <p className="text-sm text-neutral-500">
            Participant URL: <span className="font-mono">/m/{exercise.slug}</span>
            {exercise.isPublished ? null : (
              <span className="ml-2 text-amber-700 dark:text-amber-400">(draft — not public)</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/monopoly-tests/${id}/results`}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600"
          >
            Results
          </Link>
          {exercise.isPublished ? (
            <Link
              href={`/m/${exercise.slug}`}
              target="_blank"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600"
            >
              Open study
            </Link>
          ) : null}
        </div>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">Details</h2>
        {!publishCheck.ok && (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{publishCheck.reason}</p>
        )}
        <form action={updateMonopolyExerciseMeta.bind(null, id)} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Name
            <input
              name="name"
              required
              defaultValue={exercise.name}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            URL slug
            <input
              name="slug"
              required
              defaultValue={exercise.slug}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Welcome (Markdown)
            <textarea
              name="welcomeContent"
              rows={6}
              defaultValue={exercise.welcomeContent}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Completion message (Markdown)
            <textarea
              name="completionContent"
              rows={4}
              defaultValue={exercise.completionContent}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-900"
            />
          </label>
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="mb-1 font-medium">Options</legend>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="randomizeCards" defaultChecked={exercise.randomizeCards} />
              Randomize card order
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="requireAllFiatSpent" defaultChecked={exercise.requireAllFiatSpent} />
              Require all six bills placed before submit
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="allowMultipleDenominationsPerCard"
                defaultChecked={exercise.allowMultipleDenominationsPerCard}
              />
              Allow multiple bills on the same card
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="allowCardComments" defaultChecked={exercise.allowCardComments} />
              Allow comments on cards
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isPublished" defaultChecked={exercise.isPublished} />
              Published (shareable with participants)
            </label>
          </fieldset>
          <button
            type="submit"
            className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Save details
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">Cards</h2>
        <p className="mt-1 text-sm text-neutral-500">Titles shown to participants; description is optional.</p>
        <ul className="mt-4 space-y-4">
          {exercise.cards.map((card) => (
            <li key={card.id} className="rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
              <form action={updateMonopolyCard.bind(null, card.id, id)} className="flex flex-col gap-2">
                <input name="label" defaultValue={card.label} className="rounded border px-2 py-1 text-sm dark:bg-neutral-950" />
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Optional description"
                  defaultValue={card.description ?? ""}
                  className="rounded border px-2 py-1 text-sm dark:bg-neutral-950"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded bg-neutral-800 px-2 py-1 text-xs text-white dark:bg-neutral-200 dark:text-neutral-900"
                  >
                    Save card
                  </button>
                </div>
              </form>
              <div className="mt-2 flex gap-2">
                <form action={duplicateMonopolyCard.bind(null, card.id, id)}>
                  <button type="submit" className="text-xs text-neutral-600 underline dark:text-neutral-400">
                    Duplicate
                  </button>
                </form>
                <form action={deleteMonopolyCard.bind(null, card.id, id)}>
                  <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        <form action={addMonopolyCard.bind(null, id)} className="mt-6 flex flex-col gap-2 border-t border-neutral-200 pt-6 dark:border-neutral-700">
          <p className="text-sm font-medium">Add card</p>
          <input name="label" required placeholder="Title" className="rounded border px-2 py-1 text-sm dark:bg-neutral-950" />
          <textarea name="description" rows={2} placeholder="Optional description" className="rounded border px-2 py-1 text-sm dark:bg-neutral-950" />
          <button
            type="submit"
            className="w-fit rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Add card
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50/50 p-6 dark:border-red-900 dark:bg-red-950/20">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">Danger zone</h2>
        <div className="mt-2">
          <DeleteMonopolyExerciseForm exerciseId={id} />
        </div>
      </section>
    </div>
  );
}
