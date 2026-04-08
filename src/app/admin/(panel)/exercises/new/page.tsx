import Link from "next/link";
import { createExercise } from "../actions";

export default function NewExercisePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4 text-sm">
        <Link href="/admin/exercises" className="text-neutral-600 hover:underline dark:text-neutral-400">
          ← Back
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">New exercise</h1>
      <form action={createExercise} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Name
          <input
            name="name"
            required
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          URL slug
          <input
            name="slug"
            required
            placeholder="e.g. nav-study-march"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-900"
          />
          <span className="text-xs font-normal text-neutral-500">Lowercase letters, numbers, and hyphens only.</span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Type
          <select
            name="type"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900"
            defaultValue="closed"
          >
            <option value="closed">Closed (fixed categories)</option>
            <option value="open">Open (participants create categories)</option>
            <option value="hybrid">Hybrid (fixed + participant categories)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Welcome (Markdown)
          <textarea
            name="welcomeContent"
            rows={6}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-900"
            placeholder="What participants see before they start."
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Completion message (Markdown)
          <textarea
            name="completionContent"
            rows={4}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-900"
            placeholder="Thank-you text after submit."
          />
        </label>
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 font-medium">Options</legend>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="randomizeCards" />
            Randomize card order for participants
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="requireAllSorted" defaultChecked />
            Require all cards to be sorted before submit
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="allowDuplicatePlacements" />
            Allow the same card in multiple categories
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="allowCardComments" />
            Allow comments on placements
          </label>
        </fieldset>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Create and continue
        </button>
      </form>
    </div>
  );
}
