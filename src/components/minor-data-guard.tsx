"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function MinorDataGuard() {
  useEffect(() => {
    let cancelled = false;

    async function syncMinorAnalyticsOptOut() {
      const res = await fetch("/api/auth/session");
      if (!res.ok || cancelled) return;

      const data = await res.json().catch(() => null);
      if (cancelled || !data?.user?.user_metadata?.is_minor) return;

      if (typeof posthog.opt_out_capturing === "function") {
        posthog.opt_out_capturing();
      }
    }

    syncMinorAnalyticsOptOut();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
