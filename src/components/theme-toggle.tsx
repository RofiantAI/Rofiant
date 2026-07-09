"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

const ORDER = ["light", "dark", "system"] as const;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes only knows the real theme client-side; this avoids a
  // server/client mismatch on the icon shown before hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  function cycle() {
    const current = theme && (ORDER as readonly string[]).includes(theme) ? theme : "system";
    const next = ORDER[(ORDER.indexOf(current as (typeof ORDER)[number]) + 1) % ORDER.length];
    setTheme(next);
  }

  const label =
    !mounted || theme === "system"
      ? "System theme"
      : resolvedTheme === "dark"
        ? "Dark theme"
        : "Light theme";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Toggle theme (currently ${label})`}
      title={`${label} — click to change`}
      className={`flex items-center justify-center w-8 h-8 hover:rounded-md hover:bg-background-tertiary transition-colors ${className}`}
    >
      {!mounted ? (
        <Monitor className="w-4 h-4 text-foreground-muted" />
      ) : theme === "system" ? (
        <Monitor className="w-4 h-4 text-foreground-muted" />
      ) : resolvedTheme === "dark" ? (
        <Moon className="w-4 h-4 text-foreground-muted" />
      ) : (
        <Sun className="w-4 h-4 text-foreground-muted" />
      )}
    </button>
  );
}
