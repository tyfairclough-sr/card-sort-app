"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartSessionButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setError(null);
          setPending(true);
          const res = await fetch(`/api/s/${encodeURIComponent(slug)}/session`, { method: "POST" });
          setPending(false);
          if (!res.ok) {
            setError("Could not start session. Try again.");
            return;
          }
          router.push(`/s/${slug}/sort`);
        }}
        className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
      >
        {pending ? "Starting…" : "Start"}
      </button>
    </div>
  );
}
