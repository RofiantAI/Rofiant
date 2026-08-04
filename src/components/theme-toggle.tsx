"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Moon, MoonStar, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "dark-classic", label: "Dark Classic", icon: MoonStar },
] as const;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // next-themes only knows the real theme client-side; this avoids a
  // server/client mismatch on the icon shown before hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const active = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[1];
  const ActiveIcon = active.icon;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Theme (currently ${active.label})`}
        aria-expanded={open}
        title={`Theme: ${active.label}`}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${className}`}
      >
        {mounted ? (
          <ActiveIcon className="w-4 h-4 text-foreground-muted" />
        ) : (
          <Moon className="w-4 h-4 text-foreground-muted" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 border border-border bg-card py-1 shadow-sm z-50">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{opt.label}</span>
                {isActive && <Check className="w-3.5 h-3.5 shrink-0 text-accent-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
