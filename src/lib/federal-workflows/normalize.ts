import type { ZodError } from "zod";

const SENTIMENT_SYNONYMS: Record<string, "support" | "oppose" | "mixed" | "technical"> = {
  support: "support",
  supportive: "support",
  supporting: "support",
  favor: "support",
  favorable: "support",
  favourable: "support",
  positive: "support",
  pro: "support",
  infavor: "support",
  oppose: "oppose",
  opposed: "oppose",
  opposing: "oppose",
  opposition: "oppose",
  against: "oppose",
  negative: "oppose",
  con: "oppose",
  mixed: "mixed",
  neutral: "mixed",
  ambivalent: "mixed",
  balanced: "mixed",
  both: "mixed",
  technical: "technical",
  procedural: "technical",
  informational: "technical",
  informationalcomment: "technical",
};

const SEVERITY_SYNONYMS: Record<string, "critical" | "high" | "medium" | "low"> = {
  critical: "critical",
  severe: "critical",
  high: "high",
  major: "high",
  medium: "medium",
  moderate: "medium",
  med: "medium",
  low: "low",
  minor: "low",
  minimal: "low",
};

function compactKey(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

export function normalizeSentiment(value: unknown): "support" | "oppose" | "mixed" | "technical" {
  if (typeof value !== "string") return "mixed";
  const key = compactKey(value);
  return SENTIMENT_SYNONYMS[key] ?? "mixed";
}

export function normalizeSeverity(value: unknown): "critical" | "high" | "medium" | "low" {
  if (typeof value !== "string") return "medium";
  const key = compactKey(value);
  return SEVERITY_SYNONYMS[key] ?? "medium";
}

export function normalizeWorkflowPayload(solutionId: string, raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const data = { ...(raw as Record<string, unknown>) };

  if (solutionId === "regulatoryRulemaking" && Array.isArray(data.commentThemes)) {
    data.commentThemes = data.commentThemes.map((item) => {
      if (!item || typeof item !== "object") return item;
      const theme = { ...(item as Record<string, unknown>) };
      theme.sentiment = normalizeSentiment(theme.sentiment);
      if (typeof theme.count !== "number") {
        const n = Number(theme.count);
        theme.count = Number.isFinite(n) ? n : 0;
      }
      if (!Array.isArray(theme.representativeQuotes)) {
        theme.representativeQuotes = [];
      }
      return theme;
    });
  }

  if (Array.isArray(data.regulatoryImpacts)) {
    data.regulatoryImpacts = data.regulatoryImpacts.map((item) => {
      if (!item || typeof item !== "object") return item;
      const impact = { ...(item as Record<string, unknown>) };
      impact.severity = normalizeSeverity(impact.severity);
      return impact;
    });
  }

  if (typeof data.overallRisk === "string") {
    data.overallRisk = normalizeSeverity(data.overallRisk);
  }

  if (Array.isArray(data.clauseFindings)) {
    data.clauseFindings = data.clauseFindings.map((item) => {
      if (!item || typeof item !== "object") return item;
      const finding = { ...(item as Record<string, unknown>) };
      finding.severity = normalizeSeverity(finding.severity);
      return finding;
    });
  }

  if (Array.isArray(data.controlResults)) {
    data.controlResults = data.controlResults.map((item) => {
      if (!item || typeof item !== "object") return item;
      const control = { ...(item as Record<string, unknown>) };
      const status = typeof control.status === "string" ? compactKey(control.status) : "";
      control.status =
        status === "met" || status === "implemented" || status === "satisfied"
          ? "met"
          : status === "partial" || status === "partiallymet" || status === "inprogress"
            ? "partial"
            : "gap";
      return control;
    });
  }

  if (typeof data.escalationRequired !== "boolean") {
    data.escalationRequired =
      data.escalationRequired === true ||
      data.escalationRequired === "true" ||
      data.escalationRequired === "yes";
  }

  if (Array.isArray(data.checklist)) {
    data.checklist = data.checklist.map((item) => {
      if (!item || typeof item !== "object") return item;
      const row = { ...(item as Record<string, unknown>) };
      if (typeof row.met !== "boolean") {
        row.met = row.met === true || row.met === "true" || row.met === "yes" || row.met === "met";
      }
      return row;
    });
  }

  if (!Array.isArray(data.actionItems)) {
    data.actionItems = [];
  } else {
    data.actionItems = data.actionItems.map((item) => {
      if (!item || typeof item !== "object") return item;
      const action = { ...(item as Record<string, unknown>) };
      const priority = typeof action.priority === "string" ? compactKey(action.priority) : "";
      action.priority =
        priority === "urgent" || priority === "critical"
          ? "urgent"
          : priority === "high" || priority === "important"
            ? "high"
            : priority === "low" || priority === "minor"
              ? "low"
              : "normal";
      if (action.dueInDays != null && typeof action.dueInDays !== "number") {
        const n = Number(action.dueInDays);
        action.dueInDays = Number.isFinite(n) ? n : undefined;
      }
      return action;
    });
  }

  if (!Array.isArray(data.deliverables)) {
    data.deliverables = [];
  } else {
    data.deliverables = data.deliverables.map((item) => {
      if (!item || typeof item !== "object") return item;
      const deliverable = { ...(item as Record<string, unknown>) };
      const type = typeof deliverable.type === "string" ? compactKey(deliverable.type) : "";
      const allowed = ["draft", "checklist", "memo", "letter", "notice", "report"] as const;
      deliverable.type = allowed.includes(type as (typeof allowed)[number])
        ? type
        : "memo";
      return deliverable;
    });
  }

  return data;
}

export function formatZodError(error: ZodError): string {
  const first = error.issues[0];
  if (!first) return "Workflow output validation failed";
  const path = first.path.length > 0 ? first.path.join(".") : "output";
  return `Invalid workflow output at ${path}: ${first.message}`;
}
