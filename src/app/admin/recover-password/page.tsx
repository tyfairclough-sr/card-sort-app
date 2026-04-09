import { Suspense } from "react";
import Link from "next/link";

import { AppLogo } from "@/components/AppLogo";

import { RecoverPasswordGate } from "./RecoverPasswordGate";

export default function RecoverPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="mb-6">
        <Link href="/admin/login" className="inline-block">
          <AppLogo />
        </Link>
        <p className="mt-2 text-sm font-medium tracking-tight text-neutral-600 dark:text-neutral-400">
          Research App
        </p>
      </div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        Set new password
      </h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
        Choose a new password for your account (at least 8 characters).
      </p>
      <Suspense
        fallback={
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Loading…
          </p>
        }
      >
        <RecoverPasswordGate />
      </Suspense>
    </div>
  );
}
