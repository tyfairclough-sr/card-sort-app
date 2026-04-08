"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/exercises";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Admin sign in</h1>
      <form
        className="flex flex-col gap-4"
        action={async (fd) => {
          setError(null);
          setPending(true);
          const email = String(fd.get("email") ?? "");
          const password = String(fd.get("password") ?? "");
          const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          setPending(false);
          if (res?.error) {
            setError("Invalid email or password.");
            return;
          }
          window.location.href = callbackUrl;
        }}
      >
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}
