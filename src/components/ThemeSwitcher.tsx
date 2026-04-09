"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/** DaisyUI theme-controller — toggle with icons inside (https://daisyui.com/components/theme-controller/) */
export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { setTheme, theme, resolvedTheme } = useTheme();
  const effective = resolvedTheme ?? theme;
  const ready = effective !== undefined;
  const isDark = effective === "dark";
  const showPlaceholder = !mounted || !ready;

  if (showPlaceholder) {
    return (
      <div
        className="inline-block h-8 w-[3.25rem] shrink-0 rounded-full bg-base-300/40"
        aria-hidden
      />
    );
  }

  return (
    <label className="toggle toggle-sm cursor-pointer text-base-content">
      <input
        type="checkbox"
        className="theme-controller"
        value="dark"
        checked={isDark}
        onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
        aria-label={isDark ? "Use light theme" : "Use dark theme"}
      />

      <svg
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <g
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth="2"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </g>
      </svg>

      <svg
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <g
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth="2"
          fill="none"
          stroke="currentColor"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </g>
      </svg>
    </label>
  );
}
