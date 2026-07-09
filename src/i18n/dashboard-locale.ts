import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export async function getDashboardLocale() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  return hasLocale(routing.locales, cookieLocale) ? cookieLocale : routing.defaultLocale;
}

export async function getDashboardMessages(locale: string) {
  const [products, agency, misc, settings, main] = await Promise.all([
    import(`../../messages/dashboard/products.${locale}.json`).then((m) => m.default),
    import(`../../messages/dashboard/agency.${locale}.json`).then((m) => m.default),
    import(`../../messages/dashboard/misc.${locale}.json`).then((m) => m.default),
    import(`../../messages/dashboard/settings.${locale}.json`).then((m) => m.default),
    import(`../../messages/${locale}.json`).then((m) => m.default),
  ]);
  return {
    dashboard: { ...products, ...agency, ...misc, ...settings },
    solutions: { federalAgencies: main.solutions?.federalAgencies ?? {} },
  };
}
