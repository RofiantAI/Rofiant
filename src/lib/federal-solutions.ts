export const FEDERAL_SOLUTION_IDS = [
  "acquisitionContracts",
  "benefitsClaims",
  "regulatoryRulemaking",
  "citizenServices",
  "legalFoia",
  "cyberAto",
  "grantsFinancial",
  "humanCapital",
] as const;

export type FederalSolutionId = (typeof FEDERAL_SOLUTION_IDS)[number];

export type FederalSolution = {
  id: FederalSolutionId;
  agent: {
    name: string;
    description: string;
  };
  knowledgeBase: {
    name: string;
    description: string;
  };
  chatInstructions: string;
  sampleTasks: string[];
  suggestedDocuments: string[];
};

export const FEDERAL_SOLUTIONS: FederalSolution[] = [
  {
    id: "acquisitionContracts",
    agent: {
      name: "Federal Acquisition Assistant",
      description:
        "Review solicitations, contracts, and mods against FAR/DFARS clause libraries. Search uploaded procurement files, compare proposals to evaluation criteria, draft SOW/IGCE sections, and produce structured compliance findings with document citations. Flag missing clauses, inconsistent pricing, and deliverable gaps before CO review.",
    },
    knowledgeBase: {
      name: "Federal Acquisition Library",
      description:
        "FAR/DFARS supplements, agency acquisition guides, clause libraries, past SOWs, market research, and contract mods.",
    },
    chatInstructions:
      "You assist federal contracting officers and CORs. Cite FAR/DFARS sections and uploaded contract documents. Never invent clause text. Flag compliance gaps, missing evaluation factors, and inconsistent pricing. Use plain language for non-legal staff.",
    sampleTasks: [
      "Review this RFP against our agency FAR supplement and list missing clauses",
      "Compare three vendor proposals to the stated evaluation criteria",
      "Draft a mod scope paragraph from this change request memo",
    ],
    suggestedDocuments: [
      "FAR/DFARS clause library",
      "Agency acquisition guide",
      "Active contract + mods",
      "Market research / IGCE",
    ],
  },
  {
    id: "benefitsClaims",
    agent: {
      name: "Benefits & Claims Adjudicator",
      description:
        "Summarize claims files, map evidence to program requirements in CFR and policy manuals, identify missing documentation, and draft decision letters or reconsideration summaries for human review. Search across medical, employment, and benefits records with cited excerpts only—never fabricate records.",
    },
    knowledgeBase: {
      name: "Benefits & Claims Policy",
      description:
        "Program CFR, adjudication manuals, precedent decisions, form instructions, and appeals guidance.",
    },
    chatInstructions:
      "You support benefits and claims adjudicators at federal agencies. Cross-reference evidence to CFR and internal policy. List missing evidence explicitly. Draft decision language for reviewer approval—do not finalize determinations.",
    sampleTasks: [
      "Summarize this claims file and list evidence gaps against program requirements",
      "Draft a reconsideration notice citing applicable CFR sections",
      "Find similar precedent decisions for this disability rating issue",
    ],
    suggestedDocuments: [
      "Program CFR excerpts",
      "Adjudication manual",
      "Sample decision letters",
      "Form 21-526EZ instructions",
    ],
  },
  {
    id: "regulatoryRulemaking",
    agent: {
      name: "Regulatory Rulemaking Analyst",
      description:
        "Analyze public comments, cluster themes, assess Federal Register impacts on existing rules, and draft regulatory text or preamble sections with USC/CFR citations. Search uploaded dockets and interagency coordination documents. Output structured summaries for policy staff and congressional affairs.",
    },
    knowledgeBase: {
      name: "Regulatory & Rulemaking Docket",
      description:
        "Proposed rules, comment summaries, USC/CFR references, interagency memos, and OMB circulars.",
    },
    chatInstructions:
      "You assist federal regulatory policy staff. Cluster comment themes with counts. Cite USC/CFR accurately from uploaded sources. Separate factual summary from policy recommendations. Flag statutory conflicts.",
    sampleTasks: [
      "Cluster the top themes from these 500 public comments on the proposed rule",
      "Assess how this Federal Register change affects our existing regulation",
      "Draft preamble language explaining the economic impact section",
    ],
    suggestedDocuments: [
      "Proposed rule PDF",
      "Public comment export",
      "Existing regulation text",
      "Interagency coordination memo",
    ],
  },
  {
    id: "citizenServices",
    agent: {
      name: "Citizen Services Agent Assist",
      description:
        "Support contact-center agents with real-time policy lookup, plain-language form explanations, and case-context summaries from uploaded policy manuals. Transcribe and summarize call notes with PII-aware redaction markers for QA. Provide multilingual response drafts aligned to agency style guides.",
    },
    knowledgeBase: {
      name: "Citizen Services Policy Desk",
      description:
        "Call-center scripts, policy manuals, form instructions, notice templates, and FAQ libraries.",
    },
    chatInstructions:
      "You assist federal contact-center agents serving the public. Use plain language. Cite policy manual sections. Mark PII for redaction. Provide English and Spanish drafts when asked. Do not disclose internal-only guidance to simulated citizen-facing replies without labeling internal vs public.",
    sampleTasks: [
      "Explain Form 1040 Schedule C changes in plain language for a caller",
      "Summarize this call transcript and flag PII that needs redaction",
      "Look up eligibility criteria for this benefit program",
    ],
    suggestedDocuments: [
      "Contact-center policy manual",
      "Form instructions",
      "Notice templates",
      "Approved FAQ library",
    ],
  },
  {
    id: "legalFoia",
    agent: {
      name: "Legal & FOIA Reviewer",
      description:
        "Triage FOIA and Privacy Act requests, search responsive records across uploaded repositories, assist privilege and PII/CII redaction review with human-in-the-loop checkpoints, and draft litigation hold notices or discovery response outlines. Maintain source-linked audit trails for counsel review.",
    },
    knowledgeBase: {
      name: "Legal & FOIA Repository",
      description:
        "FOIA processing guides, privilege logs, redaction standards, template responses, and case files.",
    },
    chatInstructions:
      "You assist agency counsel and FOIA officers. Never release privileged content without explicit human approval. Mark suggested redactions with reason codes (b(6), b(7), etc.). Cite uploaded records only. Draft holds and responses for attorney review.",
    sampleTasks: [
      "Triage this FOIA request and suggest search terms for responsive records",
      "Review this document batch for privilege and PII redaction needs",
      "Draft a litigation hold notice for the attached matter",
    ],
    suggestedDocuments: [
      "FOIA processing manual",
      "Redaction guide",
      "Privilege log template",
      "Sample responsive records",
    ],
  },
  {
    id: "cyberAto",
    agent: {
      name: "Cybersecurity & ATO Assistant",
      description:
        "Draft SSP, SAR, and POA&M entries mapped to NIST 800-53 Rev. 5 controls, search IT policies and system boundary documentation, summarize incident tickets against NIST 800-61 playbooks, and assemble continuous monitoring evidence packages for ISSO and AO review.",
    },
    knowledgeBase: {
      name: "Security & ATO Documentation",
      description:
        "SSP/SAR drafts, NIST control mappings, POA&Ms, network diagrams, and incident playbooks.",
    },
    chatInstructions:
      "You assist federal ISSOs and security engineers. Map findings to NIST 800-53 Rev. 5 controls. Reference NIST 800-61 for incidents. Never invent system boundaries—cite uploaded SSPs and diagrams. Output assessor-ready evidence lists.",
    sampleTasks: [
      "Draft a POA&M entry for this vulnerability finding mapped to AC-2",
      "Summarize these incident tickets and match steps to our IR playbook",
      "List missing evidence for AC-17 in our current SSP",
    ],
    suggestedDocuments: [
      "System Security Plan (SSP)",
      "NIST 800-53 control matrix",
      "POA&M export",
      "Incident response playbook",
    ],
  },
  {
    id: "grantsFinancial",
    agent: {
      name: "Grants & Financial Reviewer",
      description:
        "Screen grant applications against NOFO requirements and 2 CFR 200 compliance, draft budget justifications and SF-424 attachments, flag anomalous payment patterns, and search award history for similar programs and obligation benchmarks.",
    },
    knowledgeBase: {
      name: "Grants & Financial Controls",
      description:
        "NOFOs, 2 CFR 200 guidance, budget templates, single audit findings, and award history.",
    },
    chatInstructions:
      "You assist federal grants and financial management staff. Check applications against NOFO criteria and 2 CFR 200. Flag duplicate award risk and unusual payment patterns. Cite uploaded NOFO text. Draft budget narratives for reviewer approval.",
    sampleTasks: [
      "Screen this application against the NOFO eligibility requirements",
      "Draft a budget justification narrative from these line items",
      "Find similar awards to this program for obligation benchmarking",
    ],
    suggestedDocuments: [
      "Active NOFO",
      "2 CFR 200 excerpts",
      "SF-424 instructions",
      "Prior award abstracts",
    ],
  },
  {
    id: "humanCapital",
    agent: {
      name: "Human Capital Assistant",
      description:
        "Look up OPM classification standards and qualification requirements, draft USAJOBS postings and assessment items, summarize employee relations case timelines, and generate role-based training outlines from agency policy and SOPs.",
    },
    knowledgeBase: {
      name: "Human Capital Policy Library",
      description:
        "OPM classification standards, qual handbooks, USAJOBS templates, ER guides, and training SOPs.",
    },
    chatInstructions:
      "You assist federal HR specialists and staffing offices. Cite OPM classification standards and agency HR policy. Draft USAJOBS content for HR review. Summarize ER cases chronologically without legal conclusions.",
    sampleTasks: [
      "Draft a USAJOBS posting for a GS-13 program analyst using our template",
      "Look up qual requirements for this occupational series",
      "Summarize this employee relations case file timeline",
    ],
    suggestedDocuments: [
      "OPM classification standard",
      "Agency HR policy manual",
      "USAJOBS posting template",
      "Assessment item bank",
    ],
  },
];

export function getFederalSolution(id: string): FederalSolution | undefined {
  return FEDERAL_SOLUTIONS.find((s) => s.id === id);
}

export function isFederalSolutionId(id: string): id is FederalSolutionId {
  return (FEDERAL_SOLUTION_IDS as readonly string[]).includes(id);
}

import { canAccessTool } from "@/lib/service-plan-access";

export function canDeployFederalSolutions(plan: string) {
  return canAccessTool(plan, "workflows");
}

export function applyFederalChatPreset(
  instructions: string,
  knowledgeBaseId: string,
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("chat_settings");
    const current = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      "chat_settings",
      JSON.stringify({
        ...current,
        customInstructions: instructions,
        knowledgeBaseId,
      }),
    );
  } catch {
    /* ignore */
  }
}
