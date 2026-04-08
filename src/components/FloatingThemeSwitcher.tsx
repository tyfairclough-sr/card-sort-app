"use client";

import { usePathname } from "next/navigation";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function FloatingThemeSwitcher() {
  const pathname = usePathname();
  const isAdminPanel =
    pathname.startsWith("/admin/") && !pathname.startsWith("/admin/login");

  if (isAdminPanel) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
      <ThemeSwitcher />
    </div>
  );
}
