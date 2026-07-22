"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";

const CURRENT_SHA = process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev";
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function UpdateToast() {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (CURRENT_SHA === "dev") return;

    async function check() {
      if (checkedRef.current) return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const data = await res.json();
        if (data.sha && data.sha !== CURRENT_SHA) {
          checkedRef.current = true;
          setAvailable(true);
        }
      } catch {
        // ignore transient network errors
      }
    }

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") check();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!available || dismissed) return null;

  return (
    <div
      className="fixed bottom-20 right-6 z-50 flex items-center gap-3 border border-border-light bg-background-secondary shadow-lg px-5 py-3"
      style={{ animation: "toast-in 0.3s ease-out" }}
    >
      <span className="h-2 w-2 rounded-full shrink-0 bg-accent-primary" />
      <p className="text-sm font-medium text-foreground">
        A new version of Rofiant is available
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex items-center justify-center w-6 h-6 shrink-0 text-foreground-muted hover:text-foreground transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
