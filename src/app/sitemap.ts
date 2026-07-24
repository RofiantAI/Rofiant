import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const BASE_URL = "https://rofiant.ca";

const PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "monthly", priority: 1 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/platform/chat-ai", changeFrequency: "monthly", priority: 0.8 },
  { path: "/platform/agents", changeFrequency: "monthly", priority: 0.8 },
  { path: "/resources/documentation", changeFrequency: "weekly", priority: 0.7 },
  { path: "/resources/api-reference", changeFrequency: "weekly", priority: 0.7 },
  { path: "/resources/changelog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/company/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/company/careers", changeFrequency: "weekly", priority: 0.5 },
  { path: "/company/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/company/security", changeFrequency: "monthly", priority: 0.6 },
  { path: "/download", changeFrequency: "monthly", priority: 0.8 },
  { path: "/status", changeFrequency: "daily", priority: 0.3 },
  { path: "/legal/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/terms-of-service", changeFrequency: "yearly", priority: 0.3 },
  { path: "/auth/login", changeFrequency: "yearly", priority: 0.3 },
  { path: "/auth/signup", changeFrequency: "yearly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PAGES.map(({ path, changeFrequency, priority }) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [locale, `${BASE_URL}/${locale}${path}`]),
    );

    return {
      url: `${BASE_URL}/${routing.defaultLocale}${path}`,
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages },
    };
  });
}
