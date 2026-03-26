import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Card sort research</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Run closed, open, or hybrid card sorts with a shareable link.
        </p>
      </div>
      <div className="flex flex-col gap-3 text-sm">
        {session?.user ? (
          <Link
            href="/admin/exercises"
            className="rounded-md bg-neutral-900 px-4 py-3 text-center font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Admin — exercises
          </Link>
        ) : (
          <Link
            href="/admin/login"
            className="rounded-md bg-neutral-900 px-4 py-3 text-center font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Admin sign in
          </Link>
        )}
      </div>
    </div>
  );
}
