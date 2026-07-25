import { routing } from "@/i18n/routing";

const BASE_URL = "https://www.rofiant.ca";

export function localeAlternates(locale: string, path: string = "") {
  return {
    canonical: `${BASE_URL}/${locale}${path}`,
    languages: Object.fromEntries(
      routing.locales.map((l) => [l, `${BASE_URL}/${l}${path}`]),
    ),
  };
}
