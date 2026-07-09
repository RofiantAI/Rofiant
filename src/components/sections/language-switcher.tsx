"use client";

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
    <select
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
      aria-label="Select language"
      className="h-12 bg-transparent px-2 text-sm font-medium text-foreground"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l} className="text-black bg-white">
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
