import { Suspense } from "react";
import Link from "next/link";

import { AppLogo } from "@/components/AppLogo";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
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
        Forgot password
      </h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
        Enter your email and we will send you a link to reset your password.
      </p>
      <Suspense
        fallback={
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Loading…
          </p>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
