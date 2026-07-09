import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

export default async function ChangelogPage() {
  const t = await getTranslations("resources.changelog");

  const entries = [
    {
      version: "v2.5.0",
      date: t("entries.v250.date"),
      changes: [
        { type: "feature" as const, text: t("entries.v250.changes.0") },
        { type: "feature" as const, text: t("entries.v250.changes.1") },
        { type: "improvement" as const, text: t("entries.v250.changes.2") },
      ],
    },
    {
      version: "v2.4.0",
      date: t("entries.v240.date"),
      changes: [
        { type: "feature" as const, text: t("entries.v240.changes.0") },
        { type: "feature" as const, text: t("entries.v240.changes.1") },
        { type: "improvement" as const, text: t("entries.v240.changes.2") },
      ],
    },
    {
      version: "v2.3.0",
      date: t("entries.v230.date"),
      changes: [
        { type: "feature" as const, text: t("entries.v230.changes.0") },
        { type: "feature" as const, text: t("entries.v230.changes.1") },
        { type: "fix" as const, text: t("entries.v230.changes.2") },
      ],
    },
    {
      version: "v2.2.0",
      date: t("entries.v220.date"),
      changes: [
        { type: "feature" as const, text: t("entries.v220.changes.0") },
        { type: "improvement" as const, text: t("entries.v220.changes.1") },
        { type: "fix" as const, text: t("entries.v220.changes.2") },
      ],
    },
  ];

  const typeColors = {
    feature: "success" as const,
    improvement: "info" as const,
    fix: "warning" as const,
  };

  const typeLabels: Record<"feature" | "improvement" | "fix", string> = {
    feature: t("types.feature"),
    improvement: t("types.improvement"),
    fix: t("types.fix"),
  };

  return (
    <PageLayout
      badge="RESOURCES"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="space-y-12">
        {entries.map((entry) => (
          <div key={entry.version}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-foreground">{entry.version}</h2>
              <span className="text-sm text-foreground-muted">{entry.date}</span>
            </div>
            <ul className="space-y-2">
              {entry.changes.map((c, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Badge variant={typeColors[c.type]} className="mt-0.5 shrink-0 text-[10px]">
                    {typeLabels[c.type]}
                  </Badge>
                  <span className="text-sm text-foreground-secondary">{c.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}