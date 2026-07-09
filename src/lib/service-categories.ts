import {
  type ProductTool,
  TOOL_DASHBOARD_HREFS,
  serviceCategoryToTool,
  canAccessTool,
} from "@/lib/service-plan-access";

export const SERVICE_CATEGORY_KEYS = [
  "documents",
  "voice",
  "agents",
  "workflows",
  "security",
] as const;

export type ServiceCategoryKey = (typeof SERVICE_CATEGORY_KEYS)[number];

export const SERVICE_CATEGORY_SLUGS = [
  "documents",
  "voice",
  "agents",
  "workflows",
  "security",
] as const;

export type ServiceCategorySlug = (typeof SERVICE_CATEGORY_SLUGS)[number];

/** @deprecated Old slug — redirect to voice */
export const LEGACY_SERVICE_SLUGS = ["defence-intelligence"] as const;

export const SERVICE_KEY_TO_SLUG: Record<ServiceCategoryKey, ServiceCategorySlug> = {
  documents: "documents",
  voice: "voice",
  agents: "agents",
  workflows: "workflows",
  security: "security",
};

export const SERVICE_SLUG_TO_KEY: Record<ServiceCategorySlug, ServiceCategoryKey> = {
  documents: "documents",
  voice: "voice",
  agents: "agents",
  workflows: "workflows",
  security: "security",
};

export function serviceCategoryToProductTool(key: ServiceCategoryKey): ProductTool {
  return serviceCategoryToTool(key);
}

export function canAccessServiceCategory(plan: string, key: ServiceCategoryKey): boolean {
  return canAccessTool(plan, serviceCategoryToProductTool(key));
}

/** Public marketing route — redirects logged-in users to the working tool. */
export function servicePublicHref(key: ServiceCategoryKey): string {
  return `/services/${SERVICE_KEY_TO_SLUG[key]}`;
}

/** Authenticated dashboard route (canonical product page). */
export function serviceToolHref(key: ServiceCategoryKey): string {
  const tool = serviceCategoryToProductTool(key);
  return TOOL_DASHBOARD_HREFS[tool] ?? `/dashboard/services/${SERVICE_KEY_TO_SLUG[key]}`;
}

export const SERVICE_CATEGORY_HREFS: Record<ServiceCategoryKey, string> = {
  documents: servicePublicHref("documents"),
  voice: servicePublicHref("voice"),
  agents: servicePublicHref("agents"),
  workflows: servicePublicHref("workflows"),
  security: servicePublicHref("security"),
};

export function resolveServiceSlug(slug: string): ServiceCategorySlug | "legacy-voice" | null {
  if (slug === "defence-intelligence") return "legacy-voice";
  if ((SERVICE_CATEGORY_SLUGS as readonly string[]).includes(slug)) {
    return slug as ServiceCategorySlug;
  }
  return null;
}
