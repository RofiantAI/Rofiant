"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "rofiant-chat-beta-banner-dismissed";

function subscribe(callback: () => void) {
  window.addEventListener(STORAGE_KEY, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_KEY, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) !== "1";
}

function getServerSnapshot() {
  return true;
}

export function BetaBanner() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    window.dispatchEvent(new Event(STORAGE_KEY));
  }

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-accent-primary/10 text-foreground">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-primary">
        Beta
      </span>
      <p className="flex-1 min-w-0 text-sm text-foreground-secondary">
        This software is in beta — things may change or break. Let us know what you run into.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 p-1 text-foreground-muted hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
