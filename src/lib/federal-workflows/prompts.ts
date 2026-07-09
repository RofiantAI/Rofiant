import type { FederalSolutionId } from "@/lib/federal-solutions";

type WorkflowPrompt = {
  system: string;
  task: string;
  jsonShape: string;
};

export const WORKFLOW_INPUTS: Record<
  FederalSolutionId,
  { label: string; placeholder: string; options?: { key: string; label: string; placeholder: string }[] }
> = {
  acquisitionContracts: {
    label: "Review scope",
    placeholder: "e.g. Review RFP Section L/M against our agency FAR supplement. Flag missing DFARS 252.204-7012.",
    options: [
      { key: "contractType", label: "Contract type", placeholder: "FFP / T&M / IDIQ" },
      { key: "agencySupplement", label: "Agency supplement", placeholder: "DAFFARS, DEAR, etc." },
    ],
  },
  benefitsClaims: {
    label: "Case context",
    placeholder: "Claim type, program (VA disability, SSA, etc.), and what decision is needed.",
  },
  regulatoryRulemaking: {
    label: "Rulemaking task",
    placeholder: "e.g. Summarize comment themes on proposed 40 CFR Part 60 revision.",
    options: [{ key: "docketId", label: "Docket ID", placeholder: "EPA-HQ-OAR-2024-0001" }],
  },
  citizenServices: {
    label: "Caller / case context",
    placeholder: "Paste call notes, form question, or notice the citizen received.",
    options: [{ key: "program", label: "Program", placeholder: "IRS, USCIS, SSA, CMS" }],
  },
  legalFoia: {
    label: "FOIA / Privacy Act request",
    placeholder: "Paste the request letter or describe records sought and date range.",
    options: [{ key: "requesterType", label: "Requester type", placeholder: "Media / commercial / individual" }],
  },
  cyberAto: {
    label: "Security assessment scope",
    placeholder: "System name, assessment type (initial/ongoing), and focus areas.",
    options: [
      { key: "controlFamily", label: "Control family", placeholder: "AC, AU, IA, SC…" },
      { key: "impactLevel", label: "Impact level", placeholder: "Moderate / High" },
    ],
  },
  grantsFinancial: {
    label: "Grant review context",
    placeholder: "NOFO name, applicant, and what to verify.",
    options: [{ key: "nofoId", label: "NOFO / assistance listing", placeholder: "HHS-2024-ACF-…" }],
  },
  humanCapital: {
    label: "HR task",
    placeholder: "Position title, series/grade, or ER case summary to analyze.",
    options: [{ key: "occupationalSeries", label: "Occupational series", placeholder: "0343, 2210, etc." }],
  },
};

const OPERATIONAL_JSON =
  ", actionItems: [{ action, ownerRole, priority: urgent|high|normal|low, dueInDays? }], deliverables: [{ type: draft|checklist|memo|letter|notice|report, title, content }]";

export const WORKFLOW_PROMPTS: Record<FederalSolutionId, WorkflowPrompt> = {
  acquisitionContracts: {
    system:
      "You are a federal acquisition specialist supporting contracting officers. Produce operational deliverables — CO memos, evaluation worksheets, SOW drafts — not generic summaries. Never invent clause text. Cite document names. Include actionItems for CO/COR/legal follow-up. Output strict JSON only.",
    task: "Perform a federal acquisition compliance review on the attached documents.",
    jsonShape: `{ summary, overallRisk: critical|high|medium|low, clauseFindings: [{ severity, clause, issue, citation, recommendation }], pricingFlags: [], missingDeliverables: []${OPERATIONAL_JSON} }`,
  },
  benefitsClaims: {
    system:
      "You are a federal benefits adjudication analyst. Produce decision-ready packages — evidence maps, draft notices, precedent briefs — for human sign-off. Do not finalize determinations. Include actionItems for raters and supervisors. Output strict JSON only.",
    task: "Analyze the claims file and assess adjudication readiness.",
    jsonShape: `{ summary, decisionReadiness: ready|needs_evidence|insufficient, evidenceGaps: [{ requirement, status: present|partial|missing, notes }], applicableCitations: [], draftNotice }${OPERATIONAL_JSON} }`,
  },
  regulatoryRulemaking: {
    system:
      "You are a federal regulatory policy analyst. Produce docket briefs, impact memos, and draft preamble text for clearance packages. Include actionItems for policy leads and program offices. Output strict JSON only.",
    task: "Analyze rulemaking materials and public comment patterns.",
    jsonShape: `{ summary, commentThemes: [{ theme, count: number, sentiment: "support"|"oppose"|"mixed"|"technical" (exact strings only), representativeQuotes: [] }], regulatoryImpacts: [{ existingRule, impact, severity: "critical"|"high"|"medium"|"low" }], draftPreamblePoints: []${OPERATIONAL_JSON} }`,
  },
  citizenServices: {
    system:
      "You are a federal contact-center operations assistant. Produce agent scripts, plain-language guides, and QA packages agents use on live calls. Cite policy from documents. Include actionItems for agents and supervisors. Output strict JSON only.",
    task: "Analyze the citizen inquiry and produce agent-assist guidance.",
    jsonShape: `{ summary, callerIntent, policyAnswers: [{ question, answer, policyCitation }], plainLanguageScript, escalationRequired, escalationReason?${OPERATIONAL_JSON} }`,
  },
  legalFoia: {
    system:
      "You are a federal FOIA officer. Produce triage routing, search plans, redaction queues, and draft response letters for counsel review. Mark redactions with exemption codes. Include actionItems for FOIA analysts and attorneys. Output strict JSON only.",
    task: "Triage the FOIA/Privacy Act request against available records.",
    jsonShape: `{ summary, requestType, responsiveRecordTypes: [], searchTerms: [], redactionFlags: [{ category, reason, bExemption? }], estimatedComplexity: simple|moderate|complex, triageNotes }${OPERATIONAL_JSON} }`,
  },
  cyberAto: {
    system:
      "You are a federal ISSO supporting ATO packages. Produce control assessments, SSP gap lists, POA&M drafts, and IR playbook checklists for assessor review. Map to NIST 800-53 Rev. 5. Include actionItems for ISSO and AO. Output strict JSON only.",
    task: "Assess security documentation and control implementation evidence.",
    jsonShape: `{ summary, controlFamily, controlResults: [{ control, status: met|partial|gap, evidenceFound, gap?, poamAction? }], sspGaps: [], incidentPlaybookMatches: [{ scenario, playbookStep }]${OPERATIONAL_JSON} }`,
  },
  grantsFinancial: {
    system:
      "You are a federal grants management specialist. Produce eligibility screens, budget justification drafts, and payment anomaly reports for program officers. Check 2 CFR 200. Include actionItems for grants officers. Output strict JSON only.",
    task: "Screen the grant application and financial materials.",
    jsonShape: `{ summary, nofoCompliance: eligible|conditional|ineligible, checklist: [{ requirement, met, notes }], budgetFlags: [], fraudIndicators: [], draftJustification }${OPERATIONAL_JSON} }`,
  },
  humanCapital: {
    system:
      "You are a federal HR specialist. Produce USAJOBS drafts, classification memos, and ER timelines for staffing and ER offices. Cite OPM standards. Include actionItems for HR specialists. Output strict JSON only.",
    task: "Analyze HR/classification materials and produce staffing outputs.",
    jsonShape: `{ summary, classification: { series, grade, title, qualNotes }, usajobsDraft: { title, duties: [], qualifications: [], assessmentItems: [] }, erTimeline: [{ date, event }]${OPERATIONAL_JSON} }`,
  },
};
