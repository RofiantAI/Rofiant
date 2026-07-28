"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  COOKIE_CONSENT_STORAGE_KEY as STORAGE_KEY,
  useCookieConsentNeeded,
} from "@/lib/hooks/use-cookie-consent-needed";

export function CookieBanner() {
  const needsConsent = useCookieConsentNeeded();
  // Rendered in the root layout, outside NextIntlClientProvider (so it also
  // shows on locale-free routes like /chat and /dashboard) — can't use
  // next-intl's Link/useLocale here, so the locale is derived from the URL.
  const pathname = usePathname();
  const firstSegment = pathname.split("/")[1];
  const locale = routing.locales.includes(firstSegment as (typeof routing.locales)[number])
    ? firstSegment
    : routing.defaultLocale;

  const bannerRef = useRef<HTMLDivElement>(null);

  // Other fixed-position toasts (offline/update) read this to stack above the
  // banner instead of being hidden underneath it — banner height varies by
  // breakpoint (stacked on mobile) and content, so measure rather than guess.
  useEffect(() => {
    if (!needsConsent) {
      document.documentElement.style.setProperty("--cookie-banner-height", "0px");
      return;
    }
    const el = bannerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        "--cookie-banner-height",
        `${entry.contentRect.height}px`,
      );
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.setProperty("--cookie-banner-height", "0px");
    };
  }, [needsConsent]);

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
    <div
      ref={bannerRef}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-light bg-background-secondary"
    >
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
