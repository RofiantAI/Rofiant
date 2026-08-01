"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes only knows the real theme client-side; this avoids a
  // server/client mismatch on the icon shown before hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  function cycle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  const label = mounted && resolvedTheme === "dark" ? "Dark theme" : "Light theme";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Toggle theme (currently ${label})`}
      title={`${label} — click to change`}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${className}`}
    >
      {mounted && resolvedTheme === "dark" ? (
        <Moon className="w-4 h-4 text-foreground-muted" />
      ) : (
        <Sun className="w-4 h-4 text-foreground-muted" />
      )}
    </button>
  );
}
