"use client";

import { deleteExercise } from "../actions";

export function DeleteExerciseForm({ exerciseId }: { exerciseId: string }) {
  return (
    <form
      action={async () => {
        if (!confirm("Delete this exercise and all sessions? This cannot be undone.")) return;
        await deleteExercise(exerciseId);
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      >
        Delete exercise
      </button>
    </form>
  );
}
