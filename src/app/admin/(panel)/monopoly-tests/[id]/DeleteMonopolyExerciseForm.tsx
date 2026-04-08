"use client";

import { deleteMonopolyExercise } from "../actions";

export function DeleteMonopolyExerciseForm({ exerciseId }: { exerciseId: string }) {
  return (
    <form
      action={async () => {
        if (!confirm("Delete this test and all sessions? This cannot be undone.")) return;
        await deleteMonopolyExercise(exerciseId);
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      >
        Delete test
      </button>
    </form>
  );
}
