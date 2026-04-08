import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { auth, signOut } from "@/auth";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const showNav = Boolean(session?.user);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      {showNav ? (
        <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-6">
              <Link
                href="/admin/exercises"
                className="flex shrink-0 items-center gap-3 text-neutral-900 hover:opacity-90 dark:text-neutral-50"
              >
                <AppLogo />
              </Link>
              <nav className="flex min-w-0 items-center gap-4 text-sm font-medium">
                <Link href="/admin/exercises" className="hover:underline">
                  Card sorts
                </Link>
                <Link href="/admin/monopoly-tests" className="hover:underline">
                  Monopoly tests
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
              <ThemeSwitcher />
              <span className="truncate max-w-[200px]">{session?.user?.email}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/admin/login" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
      ) : null}
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
