"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

const STORAGE_KEY = "cookie-consent";

function subscribe(callback: () => void) {
  window.addEventListener(STORAGE_KEY, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_KEY, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === null;
}

function getServerSnapshot() {
  return false;
}

export function CookieBanner() {
  const needsConsent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Rendered in the root layout, outside NextIntlClientProvider (so it also
  // shows on locale-free routes like /chat and /dashboard) — can't use
  // next-intl's Link/useLocale here, so the locale is derived from the URL.
  const pathname = usePathname();
  const firstSegment = pathname.split("/")[1];
  const locale = routing.locales.includes(firstSegment as (typeof routing.locales)[number])
    ? firstSegment
    : routing.defaultLocale;

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    document.cookie = `${STORAGE_KEY}=accepted; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent(STORAGE_KEY, { detail: "accepted" }));
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    document.cookie = `${STORAGE_KEY}=declined; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent(STORAGE_KEY, { detail: "declined" }));
  }

  if (!needsConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-light bg-background-secondary">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground tracking-wide uppercase">Cookie Notice</p>
          <p className="text-sm text-foreground-secondary mt-1">
            We use cookies to improve your experience and analyze traffic.{" "}
            <Link href={`/${locale}/legal/privacy-policy`} className="text-foreground underline underline-offset-2 hover:text-foreground-secondary transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={decline}
            className="flex-1 sm:flex-none h-9 px-5 text-sm font-medium text-foreground-secondary border border-border hover:border-border-light hover:text-foreground transition-colors duration-200"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none h-9 px-5 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
