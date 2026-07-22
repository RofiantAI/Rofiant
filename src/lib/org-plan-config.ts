export type OrgPlanSupport = {
  csmEmail: string;
  slaSummary: string;
  dataResidency: string;
};

const DEFAULT_CSM = "success@rofiant.ca";
const DEFAULT_SLA = "99.9% uptime · 4-hour P1 response · custom escalation path";
const DEFAULT_RESIDENCY = "United States (US-only cloud region)";

export function getOrgPlanSupport(): OrgPlanSupport {
  return {
    csmEmail: process.env.AGENCY_CSM_EMAIL?.trim() || DEFAULT_CSM,
    slaSummary: process.env.AGENCY_SLA_SUMMARY?.trim() || DEFAULT_SLA,
    dataResidency: process.env.DATA_RESIDENCY_REGION?.trim() || DEFAULT_RESIDENCY,
  };
}

export function isContractPlan(plan: string): boolean {
  return plan.toLowerCase() === "ultra";
}
