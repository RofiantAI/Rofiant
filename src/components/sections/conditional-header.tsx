"use client";

import { usePathname } from "next/navigation";
import { HeaderSection } from "./header-section";

export function ConditionalHeader() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return <HeaderSection />;
}
