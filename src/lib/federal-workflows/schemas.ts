import { z } from "zod";
import type { FederalSolutionId } from "@/lib/federal-solutions";

const severity = z.enum(["critical", "high", "medium", "low"]);

export const actionItemSchema = z.object({
  action: z.string(),
  ownerRole: z.string(),
  priority: z.enum(["urgent", "high", "normal", "low"]),
  dueInDays: z.number().optional(),
});

export const deliverableSchema = z.object({
  type: z.enum(["draft", "checklist", "memo", "letter", "notice", "report"]),
  title: z.string(),
  content: z.string(),
});

const operationalFields = {
  actionItems: z.array(actionItemSchema).default([]),
  deliverables: z.array(deliverableSchema).default([]),
};

export const acquisitionOutputSchema = z.object({
  summary: z.string(),
  overallRisk: severity,
  clauseFindings: z.array(
    z.object({
      severity: severity,
      clause: z.string(),
      issue: z.string(),
      citation: z.string(),
      recommendation: z.string(),
    }),
  ),
  pricingFlags: z.array(z.string()),
  missingDeliverables: z.array(z.string()),
  ...operationalFields,
});

export const benefitsOutputSchema = z.object({
  summary: z.string(),
  decisionReadiness: z.enum(["ready", "needs_evidence", "insufficient"]),
  evidenceGaps: z.array(
    z.object({
      requirement: z.string(),
      status: z.enum(["present", "partial", "missing"]),
      notes: z.string(),
    }),
  ),
  applicableCitations: z.array(z.string()),
  draftNotice: z.string(),
  ...operationalFields,
});

export const regulatoryOutputSchema = z.object({
  summary: z.string(),
  commentThemes: z.array(
    z.object({
      theme: z.string(),
      count: z.number(),
      sentiment: z.enum(["support", "oppose", "mixed", "technical"]),
      representativeQuotes: z.array(z.string()),
    }),
  ),
  regulatoryImpacts: z.array(
    z.object({
      existingRule: z.string(),
      impact: z.string(),
      severity: severity,
    }),
  ),
  draftPreamblePoints: z.array(z.string()),
  ...operationalFields,
});

export const citizenServicesOutputSchema = z.object({
  summary: z.string(),
  callerIntent: z.string(),
  policyAnswers: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      policyCitation: z.string(),
    }),
  ),
  plainLanguageScript: z.string(),
  escalationRequired: z.boolean(),
  escalationReason: z.string().optional(),
  ...operationalFields,
});

export const legalFoiaOutputSchema = z.object({
  summary: z.string(),
  requestType: z.string(),
  responsiveRecordTypes: z.array(z.string()),
  searchTerms: z.array(z.string()),
  redactionFlags: z.array(
    z.object({
      category: z.string(),
      reason: z.string(),
      bExemption: z.string().optional(),
    }),
  ),
  estimatedComplexity: z.enum(["simple", "moderate", "complex"]),
  triageNotes: z.string(),
  ...operationalFields,
});

export const cyberAtoOutputSchema = z.object({
  summary: z.string(),
  controlFamily: z.string(),
  controlResults: z.array(
    z.object({
      control: z.string(),
      status: z.enum(["met", "partial", "gap"]),
      evidenceFound: z.string(),
      gap: z.string().optional(),
      poamAction: z.string().optional(),
    }),
  ),
  sspGaps: z.array(z.string()),
  incidentPlaybookMatches: z.array(
    z.object({
      scenario: z.string(),
      playbookStep: z.string(),
    }),
  ),
  ...operationalFields,
});

export const grantsOutputSchema = z.object({
  summary: z.string(),
  nofoCompliance: z.enum(["eligible", "conditional", "ineligible"]),
  checklist: z.array(
    z.object({
      requirement: z.string(),
      met: z.boolean(),
      notes: z.string(),
    }),
  ),
  budgetFlags: z.array(z.string()),
  fraudIndicators: z.array(z.string()),
  draftJustification: z.string(),
  ...operationalFields,
});

export const humanCapitalOutputSchema = z.object({
  summary: z.string(),
  classification: z.object({
    series: z.string(),
    grade: z.string(),
    title: z.string(),
    qualNotes: z.string(),
  }),
  usajobsDraft: z.object({
    title: z.string(),
    duties: z.array(z.string()),
    qualifications: z.array(z.string()),
    assessmentItems: z.array(z.string()),
  }),
  erTimeline: z.array(
    z.object({
      date: z.string(),
      event: z.string(),
    }),
  ),
  ...operationalFields,
});

export const WORKFLOW_OUTPUT_SCHEMAS: Record<FederalSolutionId, z.ZodType> = {
  acquisitionContracts: acquisitionOutputSchema,
  benefitsClaims: benefitsOutputSchema,
  regulatoryRulemaking: regulatoryOutputSchema,
  citizenServices: citizenServicesOutputSchema,
  legalFoia: legalFoiaOutputSchema,
  cyberAto: cyberAtoOutputSchema,
  grantsFinancial: grantsOutputSchema,
  humanCapital: humanCapitalOutputSchema,
};

export type WorkflowOutputMap = {
  acquisitionContracts: z.infer<typeof acquisitionOutputSchema>;
  benefitsClaims: z.infer<typeof benefitsOutputSchema>;
  regulatoryRulemaking: z.infer<typeof regulatoryOutputSchema>;
  citizenServices: z.infer<typeof citizenServicesOutputSchema>;
  legalFoia: z.infer<typeof legalFoiaOutputSchema>;
  cyberAto: z.infer<typeof cyberAtoOutputSchema>;
  grantsFinancial: z.infer<typeof grantsOutputSchema>;
  humanCapital: z.infer<typeof humanCapitalOutputSchema>;
};
