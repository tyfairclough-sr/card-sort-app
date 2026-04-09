"use client";

import { useSearchParams } from "next/navigation";

import { RecoverPasswordForm } from "./RecoverPasswordForm";

export function RecoverPasswordGate() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        This link is missing a reset token. Open the link from your email or{" "}
        <a href="/admin/forgot-password" className="underline">
          request a new reset email
        </a>
        .
      </div>
    );
  }

  return <RecoverPasswordForm token={token} />;
}
