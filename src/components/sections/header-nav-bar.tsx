"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";

export function HeaderNavBar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <div
      className={`dark relative flex-1 flex h-12 items-center justify-between md:justify-start px-4 sm:px-6 border transition-colors duration-300 ${
        scrolled ? "border-border bg-card" : "border-transparent bg-transparent"
      }`}
    >
      {children}
    </div>
  );
}
