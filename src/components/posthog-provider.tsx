"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const STORAGE_KEY = "cookie-consent";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    const consent = localStorage.getItem(STORAGE_KEY);

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      opt_out_capturing_by_default: consent !== "accepted",
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    });

    function onConsentUpdate(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "accepted") {
        posthog.opt_in_capturing();
      } else {
        posthog.opt_out_capturing();
      }
    }

    window.addEventListener("cookie-consent", onConsentUpdate);
    return () => window.removeEventListener("cookie-consent", onConsentUpdate);
  }, []);

  if (!POSTHOG_KEY) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
