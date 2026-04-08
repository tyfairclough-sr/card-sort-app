import { Suspense } from "react";
import { AppLogo } from "@/components/AppLogo";
import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="mb-6">
        <AppLogo />
        <p className="mt-2 text-sm font-medium tracking-tight text-neutral-600 dark:text-neutral-400">
          Research App
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
