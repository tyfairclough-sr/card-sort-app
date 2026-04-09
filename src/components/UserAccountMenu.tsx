"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";

function UserAvatarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c1.8-3.2 4.7-4.5 6.5-4.5s4.7 1.3 6.5 4.5" />
    </svg>
  );
}

export function UserAccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        title="Account menu"
      >
        <UserAvatarIcon className="h-5 w-5" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 z-50 mt-2 min-w-[14rem] rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div
            className="border-b border-neutral-100 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
            role="presentation"
          >
            <span className="block truncate font-medium text-neutral-800 dark:text-neutral-200">
              {email}
            </span>
          </div>
          <Link
            href="/admin/reset-password"
            role="menuitem"
            className="block px-3 py-2 text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            onClick={() => setOpen(false)}
          >
            Reset password
          </Link>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            onClick={() => {
              setOpen(false);
              void signOut({ callbackUrl: "/admin/login" });
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
