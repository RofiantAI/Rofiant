"use client";

import type { FederalSolutionId } from "@/lib/federal-solutions";
import type { WorkflowOutputMap } from "@/lib/federal-workflows/schemas";

function SeverityBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    low: "bg-background-tertiary text-foreground-muted border-border",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${colors[level] ?? colors.low}`}>
      {level}
    </span>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background-tertiary/40 p-4 space-y-2">
      <h4 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{title}</h4>
      {children}
    </div>
  );
}

function ListItems({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-foreground-muted">None identified.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="text-sm text-foreground-secondary">• {item}</li>
      ))}
    </ul>
  );
}

function PriorityBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    urgent: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    normal: "bg-background-tertiary text-foreground-muted border-border",
    low: "bg-background-tertiary text-foreground-muted border-border",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${colors[level] ?? colors.normal}`}>
      {level}
    </span>
  );
}

function DeliverableTypeBadge({ type }: { type: string }) {
  return (
    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 border border-border rounded bg-background-tertiary text-foreground-muted">
      {type}
    </span>
  );
}

function OperationalOutputs({ output }: { output: Record<string, unknown> }) {
  const deliverables = (output.deliverables as Array<{ type: string; title: string; content: string }>) ?? [];
  const actionItems = (output.actionItems as Array<{ action: string; ownerRole: string; priority: string; dueInDays?: number }>) ?? [];

  if (deliverables.length === 0 && actionItems.length === 0) return null;

  return (
    <>
      {deliverables.length > 0 && (
        <Block title="Deliverables">
          <div className="space-y-4">
            {deliverables.map((d) => (
              <div key={`${d.type}-${d.title}`} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <DeliverableTypeBadge type={d.type} />
                  <span className="text-sm font-medium text-foreground">{d.title}</span>
                </div>
                <p className="text-sm text-foreground-secondary whitespace-pre-wrap">{d.content}</p>
              </div>
            ))}
          </div>
        </Block>
      )}
      {actionItems.length > 0 && (
        <Block title="Action items">
          <div className="space-y-2">
            {actionItems.map((item) => (
              <div key={`${item.action}-${item.ownerRole}`} className="text-sm border-b border-border pb-2 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <PriorityBadge level={item.priority} />
                  <span className="text-foreground-muted text-xs">{item.ownerRole}</span>
                  {item.dueInDays != null && (
                    <span className="text-foreground-muted text-xs">· due in {item.dueInDays}d</span>
                  )}
                </div>
                <p className="text-foreground-secondary">{item.action}</p>
              </div>
            ))}
          </div>
        </Block>
      )}
    </>
  );
}

export function WorkflowOutputView({
  solutionId,
  output,
}: {
  solutionId: FederalSolutionId;
  output: WorkflowOutputMap[FederalSolutionId];
}) {
  const summary = "summary" in output ? String(output.summary) : "";

  return (
    <div className="space-y-4">
      <OperationalOutputs output={output as Record<string, unknown>} />

      <Block title="Summary">
        <p className="text-sm text-foreground-secondary whitespace-pre-wrap">{summary}</p>
      </Block>

      {solutionId === "acquisitionContracts" && "clauseFindings" in output && (
        <>
          {"overallRisk" in output && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-muted">Overall risk</span>
              <SeverityBadge level={String(output.overallRisk)} />
            </div>
          )}
          <Block title="Clause findings">
            <div className="space-y-3">
              {(output.clauseFindings as Array<{ severity: string; clause: string; issue: string; citation: string; recommendation: string }>).map((f) => (
                <div key={`${f.clause}-${f.issue}`} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge level={f.severity} />
                    <span className="text-sm font-medium text-foreground">{f.clause}</span>
                  </div>
                  <p className="text-sm text-foreground-secondary">{f.issue}</p>
                  <p className="text-xs text-foreground-muted mt-1">Citation: {f.citation}</p>
                  <p className="text-xs text-accent-primary mt-1">{f.recommendation}</p>
                </div>
              ))}
            </div>
          </Block>
          {"pricingFlags" in output && (
            <Block title="Pricing flags"><ListItems items={output.pricingFlags as string[]} /></Block>
          )}
          {"missingDeliverables" in output && (
            <Block title="Missing deliverables"><ListItems items={output.missingDeliverables as string[]} /></Block>
          )}
        </>
      )}

      {solutionId === "benefitsClaims" && "evidenceGaps" in output && (
        <>
          {"decisionReadiness" in output && (
            <p className="text-sm">
              Readiness: <span className="font-medium text-foreground">{String(output.decisionReadiness).replace(/_/g, " ")}</span>
            </p>
          )}
          <Block title="Evidence gaps">
            <div className="space-y-2">
              {(output.evidenceGaps as Array<{ requirement: string; status: string; notes: string }>).map((g) => (
                <div key={g.requirement} className="text-sm">
                  <span className="font-medium text-foreground">{g.requirement}</span>
                  <span className="text-foreground-muted"> — {g.status}</span>
                  <p className="text-foreground-secondary text-xs mt-0.5">{g.notes}</p>
                </div>
              ))}
            </div>
          </Block>
          {"draftNotice" in output && (
            <Block title="Draft notice">
              <p className="text-sm text-foreground-secondary whitespace-pre-wrap">{String(output.draftNotice)}</p>
            </Block>
          )}
        </>
      )}

      {solutionId === "legalFoia" && "redactionFlags" in output && (
        <>
          {"estimatedComplexity" in output && (
            <p className="text-sm">Complexity: <span className="font-medium">{String(output.estimatedComplexity)}</span></p>
          )}
          <Block title="Search terms"><ListItems items={(output.searchTerms as string[]) ?? []} /></Block>
          <Block title="Redaction flags">
            <div className="space-y-2">
              {(output.redactionFlags as Array<{ category: string; reason: string; bExemption?: string }>).map((r) => (
                <div key={r.category} className="text-sm text-foreground-secondary">
                  <span className="font-medium text-foreground">{r.category}</span> — {r.reason}
                  {r.bExemption && <span className="text-foreground-muted"> ({r.bExemption})</span>}
                </div>
              ))}
            </div>
          </Block>
        </>
      )}

      {solutionId === "cyberAto" && "controlResults" in output && (
        <Block title="Control assessment">
          <div className="space-y-2">
            {(output.controlResults as Array<{ control: string; status: string; evidenceFound: string; gap?: string; poamAction?: string }>).map((c) => (
              <div key={c.control} className="text-sm border-b border-border pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-foreground">{c.control}</span>
                  <SeverityBadge level={c.status === "met" ? "low" : c.status === "partial" ? "medium" : "high"} />
                </div>
                <p className="text-foreground-secondary mt-1">{c.evidenceFound}</p>
                {c.poamAction && <p className="text-xs text-accent-primary mt-1">POA&M: {c.poamAction}</p>}
              </div>
            ))}
          </div>
        </Block>
      )}

      {solutionId === "grantsFinancial" && "checklist" in output && (
        <>
          {"nofoCompliance" in output && (
            <p className="text-sm">NOFO compliance: <span className="font-medium">{String(output.nofoCompliance)}</span></p>
          )}
          <Block title="Requirements checklist">
            <div className="space-y-1.5">
              {(output.checklist as Array<{ requirement: string; met: boolean; notes: string }>).map((c) => (
                <div key={c.requirement} className="text-sm flex gap-2">
                  <span className={c.met ? "text-accent-success" : "text-red-400"}>{c.met ? "✓" : "✗"}</span>
                  <div>
                    <span className="text-foreground">{c.requirement}</span>
                    {c.notes && <p className="text-xs text-foreground-muted">{c.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Block>
        </>
      )}

      {solutionId === "regulatoryRulemaking" && "commentThemes" in output && (
        <Block title="Comment themes">
          <div className="space-y-3">
            {(output.commentThemes as Array<{ theme: string; count: number; sentiment: string }>).map((t) => (
              <div key={t.theme} className="text-sm">
                <span className="font-medium text-foreground">{t.theme}</span>
                <span className="text-foreground-muted"> — {t.count} comments ({t.sentiment})</span>
              </div>
            ))}
          </div>
        </Block>
      )}

      {solutionId === "citizenServices" && "plainLanguageScript" in output && (
        <>
          {"callerIntent" in output && (
            <p className="text-sm text-foreground-secondary">Intent: {String(output.callerIntent)}</p>
          )}
          <Block title="Plain-language script">
            <p className="text-sm text-foreground-secondary whitespace-pre-wrap">{String(output.plainLanguageScript)}</p>
          </Block>
        </>
      )}

      {solutionId === "humanCapital" && "usajobsDraft" in output && (
        <>
          {"classification" in output && (
            <Block title="Classification">
              <p className="text-sm text-foreground-secondary">
                {(output.classification as { series: string; grade: string; title: string }).title} —{" "}
                {(output.classification as { series: string; grade: string }).series}-
                {(output.classification as { grade: string }).grade}
              </p>
            </Block>
          )}
          <Block title="USAJOBS draft">
            <p className="text-sm font-medium text-foreground">{(output.usajobsDraft as { title: string }).title}</p>
            <ListItems items={(output.usajobsDraft as { duties: string[] }).duties} />
          </Block>
        </>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-foreground-muted">Raw JSON</summary>
        <pre className="mt-2 p-3 rounded bg-background-tertiary overflow-x-auto text-foreground-secondary">
          {JSON.stringify(output, null, 2)}
        </pre>
      </details>
    </div>
  );
}
