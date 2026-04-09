import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login?callbackUrl=/admin/reset-password");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/exercises"
          className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
        >
          ← Back to admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Enter your current password, then choose a new one (at least 8 characters).
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
