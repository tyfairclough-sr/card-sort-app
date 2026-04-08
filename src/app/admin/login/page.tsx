import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 text-sm text-neutral-500 dark:text-neutral-400">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
