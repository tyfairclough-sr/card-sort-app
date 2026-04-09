"use client";

import { useActionState } from "react";

import { changePassword, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          Your password has been updated.
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Current password
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        New password
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Confirm new password
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
