import type { FederalSolutionId } from "@/lib/federal-solutions";

export type WorkflowTaskDef = {
  id: string;
  label: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  taskInstruction: string;
  outputFocus: string;
};

export const WORKFLOW_TASKS: Record<FederalSolutionId, WorkflowTaskDef[]> = {
  acquisitionContracts: [
    {
      id: "clause-review",
      label: "Solicitation clause review",
      description: "CO review memo — missing FAR/DFARS clauses, risk flags, recommended fixes.",
      inputLabel: "Review scope",
      inputPlaceholder:
        "e.g. Review RFP Section L/M against DAFFARS. Flag missing 252.204-7012 and evaluation factors.",
      taskInstruction:
        "Perform a contracting officer clause compliance review. Produce a CO review memo with prioritized findings, not a generic summary.",
      outputFocus:
        "CO review memo, clause gap list, recommended solicitation fixes, and action items for legal/CO sign-off.",
    },
    {
      id: "proposal-evaluation",
      label: "Proposal evaluation worksheet",
      description: "Score vendors against Section M criteria. Source selection support matrix.",
      inputLabel: "Evaluation context",
      inputPlaceholder:
        "Paste evaluation criteria, vendor names, and any scoring notes from the source selection team.",
      taskInstruction:
        "Build a proposal evaluation worksheet comparing vendors to stated Section M factors with strengths, weaknesses, and risk notes.",
      outputFocus:
        "Evaluation matrix by factor, comparative strengths/weaknesses, and recommended discussion points for SSEB.",
    },
    {
      id: "sow-draft",
      label: "SOW / IGCE draft",
      description: "Draft performance work statement and cost narrative from requirements.",
      inputLabel: "Requirements",
      inputPlaceholder:
        "Paste performance objectives, deliverables, period of performance, and any existing SOW sections to extend.",
      taskInstruction:
        "Draft SOW performance requirements and IGCE narrative sections ready for CO and requirements owner review.",
      outputFocus:
        "Draft SOW sections (scope, deliverables, performance standards) and IGCE justification bullets.",
    },
    {
      id: "mod-milestones",
      label: "Mod & deliverable tracker",
      description: "Track mods, CDRLs, and invoice alignment against CLINs.",
      inputLabel: "Contract context",
      inputPlaceholder:
        "Contract number, mod history, open CDRLs, or invoice discrepancies to reconcile.",
      taskInstruction:
        "Reconcile contract modifications, CDRL status, and invoice/CLIN alignment. Flag overdue deliverables and funding gaps.",
      outputFocus:
        "Mod milestone tracker, overdue CDRL list, invoice/CLIN mismatches, and COR action queue.",
    },
  ],
  benefitsClaims: [
    {
      id: "adjudication-prep",
      label: "Adjudication readiness",
      description: "Evidence map and gaps before a rating or benefits decision.",
      inputLabel: "Case context",
      inputPlaceholder: "Claim type, program (VA disability, SSA, etc.), veteran/claimant ID context, decision needed.",
      taskInstruction:
        "Prepare an adjudication readiness package mapping evidence to program requirements with explicit gaps.",
      outputFocus:
        "Evidence matrix, missing documentation list, and adjudicator action items before decision.",
    },
    {
      id: "decision-letter",
      label: "Decision letter draft",
      description: "Draft rating decision or reconsideration notice for supervisor review.",
      inputLabel: "Decision context",
      inputPlaceholder:
        "Proposed decision (grant/deny/partial), key evidence findings, and applicable CFR sections.",
      taskInstruction:
        "Draft a decision or reconsideration notice letter with CFR citations for human approval — do not finalize.",
      outputFocus:
        "Full draft decision letter, cited regulatory basis, and reviewer sign-off checklist.",
    },
    {
      id: "precedent-search",
      label: "Precedent case brief",
      description: "Similar prior decisions and how they apply to this case.",
      inputLabel: "Issue to research",
      inputPlaceholder: "Describe the medical, legal, or benefits issue needing precedent comparison.",
      taskInstruction:
        "Brief similar precedent decisions and explain applicability to the current claim issue.",
      outputFocus:
        "Precedent comparison table, distinguishing factors, and recommended decision approach for rater.",
    },
  ],
  regulatoryRulemaking: [
    {
      id: "comment-cluster",
      label: "Comment period analysis",
      description: "Cluster docket comments by theme for policy staff review.",
      inputLabel: "Docket context",
      inputPlaceholder: "Proposed rule summary, docket ID, and comment volume or sample comments.",
      taskInstruction:
        "Cluster public comments into policy-relevant themes with counts and representative positions for docket review.",
      outputFocus:
        "Theme clusters with counts, stakeholder map, and briefing bullets for policy lead.",
    },
    {
      id: "impact-assessment",
      label: "Regulatory impact memo",
      description: "How a proposed or final rule affects existing agency regulations.",
      inputLabel: "Rule change",
      inputPlaceholder: "Federal Register citation, proposed changes, and affected existing rules.",
      taskInstruction:
        "Assess regulatory impacts on existing rules and agency policy. Flag conflicts and implementation burden.",
      outputFocus:
        "Impact memo by affected rule, severity ratings, and implementation action items for program offices.",
    },
    {
      id: "preamble-draft",
      label: "Preamble & regulatory text",
      description: "Draft preamble sections and regulatory language with USC/CFR citations.",
      inputLabel: "Rulemaking task",
      inputPlaceholder: "Section to draft (economic impact, need for rule, alternatives considered, etc.).",
      taskInstruction:
        "Draft preamble language and regulatory text sections with accurate USC/CFR citations for policy staff review.",
      outputFocus:
        "Draft preamble paragraphs, proposed regulatory text, and citation footnotes for clearance package.",
    },
  ],
  citizenServices: [
    {
      id: "agent-assist",
      label: "Agent assist script",
      description: "Real-time policy lookup and talking points for the contact center agent.",
      inputLabel: "Caller / case context",
      inputPlaceholder: "Caller question, case number context, program, and what the citizen was told.",
      taskInstruction:
        "Produce contact-center agent assist: policy answers, talking points, and escalation guidance for the live call.",
      outputFocus:
        "Agent talking script, policy citations, next steps for citizen, and escalation path if needed.",
    },
    {
      id: "form-explain",
      label: "Plain-language form guide",
      description: "Explain a form or notice in language citizens can act on.",
      inputLabel: "Form or notice",
      inputPlaceholder: "Paste form section, notice text, or citizen question about what to submit.",
      taskInstruction:
        "Explain the form or notice in plain language with step-by-step actions the citizen should take.",
      outputFocus:
        "Plain-language guide, required documents list, deadlines, and common mistakes to avoid.",
    },
    {
      id: "call-summary",
      label: "Call summary & QA package",
      description: "Summarize call notes with PII flags for quality assurance review.",
      inputLabel: "Call notes / transcript",
      inputPlaceholder: "Paste call notes or transcript. Mark any known PII fields.",
      taskInstruction:
        "Summarize the call for QA: resolution status, policy applied, PII redaction flags, and coaching notes.",
      outputFocus:
        "QA summary, PII redaction markers, resolution status, and supervisor coaching points.",
    },
  ],
  legalFoia: [
    {
      id: "foia-triage",
      label: "FOIA request triage",
      description: "Route request, estimate complexity, and build a search plan.",
      inputLabel: "FOIA request",
      inputPlaceholder: "Paste the request letter or describe records sought, date range, and requester type.",
      taskInstruction:
        "Triage the FOIA/Privacy Act request: assign track, estimate complexity, and produce a records search plan.",
      outputFocus:
        "Triage routing decision, search term list, responsive record types, and processing timeline estimate.",
    },
    {
      id: "redaction-review",
      label: "Redaction review queue",
      description: "Privilege and PII/CII redaction review with exemption codes.",
      inputLabel: "Records to review",
      inputPlaceholder: "Describe the document batch or paste excerpts needing redaction review.",
      taskInstruction:
        "Review records for privilege, PII, and CII redactions. Assign FOIA exemption codes with human-review checkpoints.",
      outputFocus:
        "Redaction queue by document, exemption codes (b(1)–b(9)), and attorney review checklist.",
    },
    {
      id: "response-draft",
      label: "FOIA response letter",
      description: "Draft response letter with withhold/release determinations.",
      inputLabel: "Response context",
      inputPlaceholder: "Request details, records found, withhold reasons, and fee status.",
      taskInstruction:
        "Draft a FOIA response letter with release/withhold determinations and appeal rights language for counsel review.",
      outputFocus:
        "Full draft response letter, exemption justifications, and records inventory attachment outline.",
    },
  ],
  cyberAto: [
    {
      id: "control-assess",
      label: "Control assessment & POA&M",
      description: "Map evidence to NIST 800-53 controls and draft POA&M entries.",
      inputLabel: "Assessment scope",
      inputPlaceholder: "System name, control family focus, and assessment type (initial/ongoing).",
      taskInstruction:
        "Assess control implementation evidence against NIST 800-53 Rev. 5 and draft POA&M entries for gaps.",
      outputFocus:
        "Control status matrix, evidence gaps, and draft POA&M items ready for ISSO submission.",
    },
    {
      id: "ssp-gap",
      label: "SSP gap analysis",
      description: "Find missing SSP sections and evidence for assessor review.",
      inputLabel: "SSP review scope",
      inputPlaceholder: "System boundary, impact level, and control families to assess.",
      taskInstruction:
        "Identify SSP documentation gaps and missing continuous monitoring evidence for assessor package.",
      outputFocus:
        "SSP gap list by control, missing artifacts, and ISSO remediation action queue with priorities.",
    },
    {
      id: "incident-match",
      label: "Incident response playbook match",
      description: "Match incident tickets to NIST 800-61 IR playbook steps.",
      inputLabel: "Incident details",
      inputPlaceholder: "Incident tickets, timeline, system affected, and current response status.",
      taskInstruction:
        "Match incident details to IR playbook steps, identify missed actions, and draft status update for CISO.",
      outputFocus:
        "Playbook step checklist with completion status, missed actions, and CISO briefing bullets.",
    },
  ],
  grantsFinancial: [
    {
      id: "nofo-screen",
      label: "NOFO eligibility screen",
      description: "Screen application against NOFO requirements and 2 CFR 200.",
      inputLabel: "Application context",
      inputPlaceholder: "NOFO name/ID, applicant organization, and eligibility questions to verify.",
      taskInstruction:
        "Screen the grant application against NOFO eligibility and 2 CFR 200 requirements with a pass/fail checklist.",
      outputFocus:
        "Eligibility determination, requirement checklist, and program officer review notes.",
    },
    {
      id: "budget-justify",
      label: "Budget justification draft",
      description: "Draft SF-424 budget narrative and line-item justifications.",
      inputLabel: "Budget data",
      inputPlaceholder: "Budget line items, NOFO cost categories, and any prior award amounts.",
      taskInstruction:
        "Draft budget justification narrative and SF-424 attachment language for grants officer review.",
      outputFocus:
        "Budget narrative draft, line-item justifications, and cost reasonableness notes.",
    },
    {
      id: "fraud-check",
      label: "Payment anomaly review",
      description: "Flag duplicate awards, unusual payments, and obligation risks.",
      inputLabel: "Financial data context",
      inputPlaceholder: "Award IDs, payment patterns, recipient info, or audit findings to investigate.",
      taskInstruction:
        "Review financial data for duplicate award risk, anomalous payments, and obligation compliance issues.",
      outputFocus:
        "Anomaly findings, fraud risk indicators, and financial management action items.",
    },
  ],
  humanCapital: [
    {
      id: "usajobs-draft",
      label: "USAJOBS posting draft",
      description: "Draft announcement with duties, quals, and assessment items.",
      inputLabel: "Position details",
      inputPlaceholder: "Position title, series/grade target, org unit, and key duties.",
      taskInstruction:
        "Draft a complete USAJOBS posting with duties, qualifications, and assessment items for HR review.",
      outputFocus:
        "Full USAJOBS draft (title, duties, qualifications, assessment plan) ready for HR sign-off.",
    },
    {
      id: "classification",
      label: "Position classification",
      description: "Series, grade, and title determination with OPM standard citations.",
      inputLabel: "Position description",
      inputPlaceholder: "Paste PD, key duties, supervisory status, and complexity factors.",
      taskInstruction:
        "Determine classification (series, grade, title) citing OPM standards with qualification notes.",
      outputFocus:
        "Classification determination memo with OPM standard citations and qualification requirements.",
    },
    {
      id: "er-timeline",
      label: "Employee relations timeline",
      description: "Chronological ER case summary for management and counsel.",
      inputLabel: "ER case summary",
      inputPlaceholder: "Case type, involved parties, key dates, and documents in the file.",
      taskInstruction:
        "Build a chronological employee relations case timeline with key events and pending actions.",
      outputFocus:
        "ER timeline, open action items, and management briefing memo (no legal conclusions).",
    },
  ],
};

export function getWorkflowTasks(solutionId: FederalSolutionId): WorkflowTaskDef[] {
  return WORKFLOW_TASKS[solutionId];
}

export function getWorkflowTask(
  solutionId: FederalSolutionId,
  taskId: string,
): WorkflowTaskDef | undefined {
  return WORKFLOW_TASKS[solutionId].find((t) => t.id === taskId);
}

export function getDefaultTaskId(solutionId: FederalSolutionId): string {
  return WORKFLOW_TASKS[solutionId][0].id;
}
