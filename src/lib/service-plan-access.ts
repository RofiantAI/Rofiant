export const PLANS = ["free", "pro", "team", "pilot", "agency", "enterprise"] as const;
export type PlanId = (typeof PLANS)[number];

export const PRODUCT_TOOLS = [
  "chat",
  "documents",
  "voice",
  "agents",
  "workflows",
  "security",
  "apiKeys",
  "knowledgeBases",
  "orgHub",
  "intelFeed",
] as const;

export type ProductTool = (typeof PRODUCT_TOOLS)[number];

const PRO_TOOLS: ProductTool[] = [
  "chat",
  "security",
  "documents",
  "voice",
  "agents",
  "apiKeys",
  "knowledgeBases",
];

const TEAM_TOOLS: ProductTool[] = [...PRO_TOOLS];

const PILOT_TOOLS: ProductTool[] = [
  "chat",
  "security",
  "documents",
  "workflows",
  "knowledgeBases",
];

const AGENCY_TOOLS: ProductTool[] = [
  ...PRO_TOOLS,
  "workflows",
  "orgHub",
  "intelFeed",
];

/** Tools included on each plan (source of truth for dashboard + API gates). */
export const PLAN_TOOLS: Record<PlanId, readonly ProductTool[]> = {
  free: ["chat", "security"],
  pro: PRO_TOOLS,
  team: TEAM_TOOLS,
  pilot: PILOT_TOOLS,
  agency: AGENCY_TOOLS,
  enterprise: AGENCY_TOOLS,
};

/** Lowest plan that unlocks a tool (for upgrade messaging). */
export const TOOL_MIN_PLAN: Record<ProductTool, PlanId> = {
  chat: "free",
  security: "free",
  documents: "pro",
  voice: "pro",
  agents: "pro",
  apiKeys: "pro",
  knowledgeBases: "pro",
  workflows: "pilot",
  orgHub: "agency",
  intelFeed: "agency",
};

/** Knowledge base count limits per plan. */
export const KB_LIMITS: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  team: 3,
  pilot: 3,
  agency: Infinity,
  enterprise: Infinity,
};

export function normalizePlan(plan: string | undefined | null): PlanId {
  const value = (plan ?? "free").toLowerCase();
  if ((PLANS as readonly string[]).includes(value)) return value as PlanId;
  return "free";
}

export function canAccessTool(plan: string, tool: ProductTool): boolean {
  return PLAN_TOOLS[normalizePlan(plan)].includes(tool);
}

export function toolsForPlan(plan: string): ProductTool[] {
  return [...PLAN_TOOLS[normalizePlan(plan)]];
}

export function kbLimitForPlan(plan: string): number {
  return KB_LIMITS[normalizePlan(plan)] ?? 0;
}

export function upgradeTargetForTool(tool: ProductTool): { plan: PlanId; href: string } {
  const min = TOOL_MIN_PLAN[tool];
  if (min === "pilot" || min === "agency") return { plan: min, href: "/solutions" };
  if (min === "pro") return { plan: "pro", href: "/pricing" };
  return { plan: "free", href: "/dashboard/services" };
}

/** @deprecated Use canAccessTool */
export function canAccessService(plan: string, service: string): boolean {
  return canAccessTool(plan, serviceCategoryToTool(service));
}

/** Map public service category keys to product tools. */
export function serviceCategoryToTool(key: string): ProductTool {
  const map: Record<string, ProductTool> = {
    documentIntelligence: "documents",
    documents: "documents",
    voiceAi: "voice",
    voice: "voice",
    agentsAutomation: "agents",
    agents: "agents",
    verticalAi: "workflows",
    workflows: "workflows",
    sovereignAi: "security",
    security: "security",
  };
  return map[key] ?? "security";
}

export function canAccessServiceCategory(plan: string, key: string): boolean {
  return canAccessTool(plan, serviceCategoryToTool(key));
}

/** Canonical dashboard routes for hub + redirects. */
export const TOOL_DASHBOARD_HREFS: Record<ProductTool, string | null> = {
  chat: "/chat",
  documents: "/dashboard/documents",
  voice: "/dashboard/voice-ai",
  agents: "/dashboard/agents",
  workflows: "/dashboard/agency/solutions",
  security: "/dashboard/audit-log",
  apiKeys: "/dashboard/api-keys",
  knowledgeBases: "/dashboard/knowledge-bases",
  orgHub: "/dashboard/agency",
  intelFeed: "/dashboard/agency/intelligence",
};

/** Tools shown on the public /services hub and dashboard tools page. */
export const HUB_TOOLS: ProductTool[] = [
  "documents",
  "voice",
  "agents",
  "workflows",
  "security",
];
