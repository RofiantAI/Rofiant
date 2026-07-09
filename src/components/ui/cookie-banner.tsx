"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    document.cookie = `${STORAGE_KEY}=accepted; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("cookie-consent", { detail: "accepted" }));
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    document.cookie = `${STORAGE_KEY}=declined; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("cookie-consent", { detail: "declined" }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-light bg-background-secondary">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground tracking-wide uppercase">Cookie Notice</p>
          <p className="text-sm text-foreground-secondary mt-1">
            We use cookies to improve your experience and analyze traffic.{" "}
            <a href="/legal/privacy-policy" className="text-foreground underline underline-offset-2 hover:text-foreground-secondary transition-colors">
              Privacy Policy
            </a>
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
