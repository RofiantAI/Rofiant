"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 h-12 px-2">
      <Languages className="h-4 w-4 text-foreground" aria-hidden="true" />
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value })}
        aria-label="Select language"
        className="h-12 bg-transparent px-1 text-sm font-medium text-foreground"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l} className="text-foreground bg-background">
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </div>
  );
}
