import type { FederalSolutionId } from "@/lib/federal-solutions";

/** Curated reference text prepended to workflow context when enabled. */
export const REFERENCE_PACKS: Partial<Record<FederalSolutionId, string>> = {
  acquisitionContracts: `FAR/DFARS quick reference (summary):
- FAR Part 12: commercial items; Part 15: negotiated procurement
- DFARS 252.204-7012: covered defense information / cyber
- DFARS 252.204-7019/7020: CMMC / NIST 800-171 flow-down
- Required docs: SOW/PWS, IGCE, evaluation factors, clause matrix
- Mod types: bilateral, unilateral; track CLINs and CDRLs`,

  legalFoia: `FOIA triage reference (summary):
- Statutory exemptions: b(1) national security through b(9) geological
- Common: b(6) personal privacy, b(7) law enforcement, b(5) deliberative
- Privacy Act: retrieve only by name/identifier with PA systems of records
- Multi-track processing; consult component for classified segments
- Document search: email, SharePoint, records retention schedules`,

  cyberAto: `NIST 800-53 Rev. 5 control families (summary):
- AC: access control; AU: audit; IA: identification & authentication
- SC: system comms protection; SI: system integrity; CM: config management
- SSP must define boundary, interconnections, inheritance, and control status
- POA&M: weakness, risk level, milestones, responsible official
- NIST 800-61: preparation, detection, analysis, containment, eradication, recovery`,

  grantsFinancial: `2 CFR 200 highlights (summary):
- Eligibility, cost principles, procurement standards, audit (Subpart F)
- NOFO must state eligibility, deadlines, match requirements, reporting
- SF-424 family: application, budget, assurances
- Single Audit threshold; major program determination
- Risk: duplicate beneficiaries, unsupported costs, subrecipient monitoring`,

  benefitsClaims: `Federal benefits adjudication (summary):
- Decisions must cite regulatory authority (CFR) and agency manual sections
- Evidence standard varies by program (preponderance, clear & convincing)
- Duty to assist where applicable; develop record before denial
- Appeal paths: reconsideration, BVA, federal court (program-specific)`,

  regulatoryRulemaking: `Rulemaking process (summary):
- APA: notice, comment period, final rule with basis & purpose
- Regulated entities need: economic analysis, Paperwork Reduction Act, 508
- Comment clustering by legal/economic/technical themes
- Congressional Review Act window for major rules`,

  citizenServices: `Contact center standards (summary):
- Plain language (Executive Order 13563); reading level ~8th grade
- PII minimization; verify identity before disclosing account data
- Escalate fraud, safety, and legal advice requests
- LEP: meaningful access per DOJ guidance`,

  humanCapital: `OPM staffing reference (summary):
- Classification: series, grade, official title per OPM standards
- USAJOBS: duties, KSAs/competencies, assessment strategy
- Veterans preference; delegated examining vs merit promotion
- ER: timeline documentation, Weingarten, proposed vs final actions`,
};

export function getReferencePack(solutionId: FederalSolutionId): string | null {
  return REFERENCE_PACKS[solutionId] ?? null;
}
