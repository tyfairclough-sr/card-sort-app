"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import { FloatingThemeSwitcher } from "@/components/FloatingThemeSwitcher";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem={false}
      themes={["light", "dark"]}
    >
      <SessionProvider refetchOnWindowFocus={false}>
        {children}
        <FloatingThemeSwitcher />
      </SessionProvider>
    </ThemeProvider>
  );
}
