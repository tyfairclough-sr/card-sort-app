import Link from "next/link";
import { ImportCardSortForm } from "./ImportCardSortForm";

export default function ImportExercisePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4 text-sm">
        <Link href="/admin/exercises" className="text-neutral-600 hover:underline dark:text-neutral-400">
          ← All exercises
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Import card sort</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Upload a configuration JSON from another instance (or the same one) to create a new draft exercise with the same
        cards, preset categories, type, messages, and options. Participant data is not included.
      </p>
      <ImportCardSortForm />
    </div>
  );
}
