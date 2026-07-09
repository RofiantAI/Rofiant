import type { FederalSolutionId } from "@/lib/federal-solutions";

export const WORKFLOW_CATEGORIES: {
  key: string;
  solutions: FederalSolutionId[];
}[] = [
  { key: "contracting", solutions: ["acquisitionContracts", "grantsFinancial"] },
  { key: "benefits", solutions: ["benefitsClaims", "citizenServices"] },
  { key: "policy", solutions: ["regulatoryRulemaking", "legalFoia"] },
  { key: "operations", solutions: ["cyberAto", "humanCapital"] },
];

export function getWorkflowCategoryKey(solutionId: FederalSolutionId): string | null {
  return WORKFLOW_CATEGORIES.find((c) => c.solutions.includes(solutionId))?.key ?? null;
}
