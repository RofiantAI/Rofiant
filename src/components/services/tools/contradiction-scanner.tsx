"use client";

import { AlertTriangle, CheckCircle2, Download, GitCompare, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ContradictionScanOutput } from "@/lib/tools/contradiction-scan";
import { buildProvenanceReceipt, provenanceReceiptFilename } from "@/lib/ai-provenance-receipt";
import { downloadTextFile } from "@/lib/federal-workflows/export";
import {
  DashboardAlert,
  DashboardCard,
  DashboardPrimaryButton,
  DashboardSection,
} from "@/components/dashboard/ui/page-shell";

type Doc = {
  id: string;
  name: string;
  status: "uploading" | "indexed" | "failed";
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/15 text-red-600 dark:text-red-400",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  low: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  none: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export function ContradictionScanner({ docs }: { docs: Doc[] }) {
  const t = useTranslations("dashboard.documents.contradictionScan");
  const indexed = docs.filter((d) => d.status === "indexed");
  const [selected, setSelected] = useState<string[]>([]);
  const [focusArea, setFocusArea] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ContradictionScanOutput | null>(null);
  const [lastUsage, setLastUsage] = useState<{ inputTokens: number; outputTokens: number } | undefined>();

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 5 ? prev : [...prev, id],
    );
  }

  async function handleScan() {
    if (selected.length < 2) return;
    setRunning(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/tools/contradiction-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentIds: selected,
        focusArea: focusArea.trim() || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t("errors.failed"));
      setRunning(false);
      return;
    }

    setResult(data.output);
    setLastUsage(data.usage);
    setRunning(false);
  }

  function handleExport() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contradiction-scan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleProvenanceExport() {
    if (!result) return;
    const receipt = await buildProvenanceReceipt({
      source: "contradiction_scan",
      inputText: focusArea,
      documentIds: selected,
      documentNames: selected
        .map((id) => docs.find((d) => d.id === id)?.name)
        .filter((name): name is string => Boolean(name)),
      output: result,
      usage: lastUsage,
    });
    downloadTextFile(
      provenanceReceiptFilename("contradiction-scan"),
      JSON.stringify(receipt, null, 2),
      "application/json",
    );
  }

  return (
    <DashboardSection title={t("heading")}>
      <p className="text-sm text-foreground-secondary mb-4 -mt-2">{t("description")}</p>

      {indexed.length < 2 ? (
        <DashboardAlert>{t("needMoreDocs")}</DashboardAlert>
      ) : (
        <>
          <DashboardCard padding={false}>
            <div className="divide-y divide-border max-h-56 overflow-y-auto">
              {indexed.map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-background-secondary/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(doc.id)}
                    onChange={() => toggle(doc.id)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground truncate">{doc.name}</span>
                </label>
              ))}
            </div>
          </DashboardCard>

          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              placeholder={t("focusPlaceholder")}
              className="flex-1 h-9 px-3 rounded-md bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
            />
            <DashboardPrimaryButton
              onClick={handleScan}
              disabled={running || selected.length < 2}
            >
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GitCompare className="w-4 h-4" />
              )}
              {running ? t("running") : t("run", { count: selected.length })}
            </DashboardPrimaryButton>
          </div>
        </>
      )}

      {error && (
        <div className="mt-4">
          <DashboardAlert>{error}</DashboardAlert>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${SEVERITY_STYLES[result.overallRisk] ?? SEVERITY_STYLES.low}`}
                >
                  {t("riskLabel", { risk: result.overallRisk })}
                </span>
                <span className="text-xs text-foreground-muted">
                  {t("findingCount", { count: result.contradictions.length })}
                </span>
              </div>
              <p className="text-sm text-foreground">{result.summary}</p>
            </div>
            <button
              type="button"
              onClick={handleProvenanceExport}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-accent-primary/40 bg-accent-primary/5 hover:bg-accent-primary/10"
            >
              <Download className="w-3.5 h-3.5" />
              {t("provenanceExport")}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-background-tertiary"
            >
              <Download className="w-3.5 h-3.5" />
              {t("export")}
            </button>
          </div>

          {result.contradictions.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 border border-border rounded-md px-4 py-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {t("noContradictions")}
            </div>
          ) : (
            <div className="space-y-3">
              {result.contradictions.map((item, i) => (
                <div key={i} className="border border-border rounded-md p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-foreground-muted" />
                    <span className="text-sm font-medium text-foreground">{item.topic}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${SEVERITY_STYLES[item.severity]}`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-xs text-foreground-muted">{item.category}</span>
                  </div>
                  <p className="text-sm text-foreground-secondary mb-3">{item.description}</p>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-background-secondary rounded p-3">
                      <p className="font-medium text-foreground mb-1">{item.docA.name}</p>
                      {item.docA.location && (
                        <p className="text-foreground-muted mb-1">{item.docA.location}</p>
                      )}
                      <p className="text-foreground-secondary italic">&ldquo;{item.docA.excerpt}&rdquo;</p>
                    </div>
                    <div className="bg-background-secondary rounded p-3">
                      <p className="font-medium text-foreground mb-1">{item.docB.name}</p>
                      {item.docB.location && (
                        <p className="text-foreground-muted mb-1">{item.docB.location}</p>
                      )}
                      <p className="text-foreground-secondary italic">&ldquo;{item.docB.excerpt}&rdquo;</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-muted mt-3">
                    <span className="font-medium text-foreground">{t("recommendation")}: </span>
                    {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {result.alignedFacts.length > 0 && (
            <div className="border border-border rounded-md p-4">
              <p className="text-sm font-medium text-foreground mb-2">{t("alignedHeading")}</p>
              <ul className="text-sm text-foreground-secondary space-y-1 list-disc pl-5">
                {result.alignedFacts.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </div>
          )}

          {result.reviewNotes && (
            <p className="text-xs text-foreground-muted border-t border-border pt-3">
              {result.reviewNotes}
            </p>
          )}
        </div>
      )}
    </DashboardSection>
  );
}
