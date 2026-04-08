"use client";

import { useActionState } from "react";
import { importCardSortConfiguration, type ImportCardSortState } from "../actions";

export function ImportCardSortForm() {
  const [state, formAction, pending] = useActionState(importCardSortConfiguration, null as ImportCardSortState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {state.error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Configuration file (.json)
        <input
          type="file"
          name="file"
          accept="application/json,.json"
          required
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
        />
        <span className="text-xs font-normal text-neutral-500">
          Use “Export configuration” on an exercise to download this file.
        </span>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        URL slug for this instance
        <input
          name="slug"
          required
          placeholder="e.g. nav-study-copy"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-900"
        />
        <span className="text-xs font-normal text-neutral-500">
          Must be unique on this server. Lowercase letters, numbers, and hyphens only.
        </span>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Name (optional)
        <input
          name="name"
          placeholder="Defaults to the name in the file"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {pending ? "Importing…" : "Import and open"}
      </button>
    </form>
  );
}
