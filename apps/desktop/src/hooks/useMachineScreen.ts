import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/** Module-level singleton poller: however many components call
 * useMachineScreen(true) at once (thumbnail, big view, modal all mounted
 * together), only ONE /api/machine/screen request is ever in flight at a
 * time. Concurrent capture requests were enough to wedge the VM's Xvfb, so
 * this isn't just an optimization -- separate independent per-component
 * pollers actively broke the feature. */
type Listener = (url: string | null, error: string | null) => void;

let currentUrl: string | null = null;
let currentError: string | null = null;
const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | null = null;
let activeIntervalMs = Infinity;

function notify() {
  for (const l of listeners) l(currentUrl, currentError);
}

async function tick() {
  try {
    const res = await apiFetch("/api/machine/screen");
    const blob = await res.blob();
    const next = URL.createObjectURL(blob);
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = next;
    currentError = null;
  } catch (err) {
    currentError = err instanceof Error ? err.message : "Failed to load screen";
  }
  notify();
}

function ensurePolling(intervalMs: number) {
  if (timer && intervalMs >= activeIntervalMs) return; // an equal-or-faster poll is already running
  if (timer) clearInterval(timer);
  activeIntervalMs = intervalMs;
  tick();
  timer = setInterval(tick, intervalMs);
}

function stopPolling() {
  if (timer) clearInterval(timer);
  timer = null;
  activeIntervalMs = Infinity;
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = null;
  currentError = null;
}

/** Polls a PNG snapshot of the VM's virtual display while `enabled`, shared
 * across every mounted consumer (see module doc above). Needs apiFetch
 * (auth header) rather than a plain <img src>, so it fetches a blob and
 * swaps an object URL in on each tick. */
export function useMachineScreen(enabled: boolean, intervalMs = 2000) {
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(currentError);

  useEffect(() => {
    if (!enabled) return;

    const listener: Listener = (u, e) => {
      setUrl(u);
      setError(e);
    };
    listeners.add(listener);
    ensurePolling(intervalMs);
    setUrl(currentUrl);
    setError(currentError);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { url, error };
}
