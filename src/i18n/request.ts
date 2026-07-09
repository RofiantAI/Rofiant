import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [base, products, agency, misc, settings] = await Promise.all([
    import(`../../messages/${locale}.json`).then((m) => m.default),
    import(`../../messages/dashboard/products.${locale}.json`).then((m) => m.default),
    import(`../../messages/dashboard/agency.${locale}.json`).then((m) => m.default),
    import(`../../messages/dashboard/misc.${locale}.json`).then((m) => m.default),
    import(`../../messages/dashboard/settings.${locale}.json`).then((m) => m.default),
  ]);

  return {
    locale,
    messages: {
      ...base,
      dashboard: { ...products, ...agency, ...misc, ...settings },
    },
    onError(error) {
      if (process.env.NODE_ENV !== "production") console.error(error);
    },
    getMessageFallback({ namespace, key }) {
      return [namespace, key].filter(Boolean).join(".");
    },
  };
});
