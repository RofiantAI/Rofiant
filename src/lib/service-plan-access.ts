export const PLANS = ["free", "pro", "ultra"] as const;
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

const ULTRA_TOOLS: ProductTool[] = [
  ...PRO_TOOLS,
  "workflows",
  "orgHub",
  "intelFeed",
];

/** Tools included on each plan (source of truth for dashboard + API gates). */
export const PLAN_TOOLS: Record<PlanId, readonly ProductTool[]> = {
  free: ["chat", "security"],
  pro: PRO_TOOLS,
  ultra: ULTRA_TOOLS,
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
  workflows: "ultra",
  orgHub: "ultra",
  intelFeed: "ultra",
};

/** Knowledge base count limits per plan. */
export const KB_LIMITS: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  ultra: Infinity,
};

export function normalizePlan(plan: string | undefined | null): PlanId {
  const value = (plan ?? "free").toLowerCase();
  if ((PLANS as readonly string[]).includes(value)) return value as PlanId;
  return "free";
}

export function canAccessTool(plan: string, tool: ProductTool): boolean {
  return PLAN_TOOLS[normalizePlan(plan)].includes(tool);
}

export function kbLimitForPlan(plan: string): number {
  return KB_LIMITS[normalizePlan(plan)] ?? 0;
}

export function upgradeTargetForTool(tool: ProductTool): { plan: PlanId; href: string } {
  const min = TOOL_MIN_PLAN[tool];
  return { plan: min, href: "/pricing" };
}
