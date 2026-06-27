import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";

export default function ChangelogPage() {
  const entries = [
    {
      version: "v2.4.0",
      date: "January 15, 2026",
      changes: [
        { type: "feature" as const, text: "Voice AI — real-time transcription and summarization" },
        { type: "feature" as const, text: "Agent pipelines — multi-step reasoning with approval gates" },
        { type: "improvement" as const, text: "Chat latency improvements" },
      ],
    },
    {
      version: "v2.3.0",
      date: "December 20, 2025",
      changes: [
        { type: "feature" as const, text: "Document intelligence with RAG-powered search" },
        { type: "feature" as const, text: "Webhook support for real-time event notifications" },
        { type: "fix" as const, text: "Fixed token counting for non-Latin scripts" },
      ],
    },
    {
      version: "v2.2.0",
      date: "November 30, 2025",
      changes: [
        { type: "feature" as const, text: "Go SDK release" },
        { type: "improvement" as const, text: "Improved audit log query performance" },
        { type: "fix" as const, text: "Fixed SSO session timeout handling" },
      ],
    },
  ];

  const typeColors = {
    feature: "success" as const,
    improvement: "info" as const,
    fix: "warning" as const,
  };

  return (
    <PageLayout
      badge="RESOURCES"
      title="Changelog"
      subtitle="Latest updates, features, and improvements to Rofiant."
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
                    {c.type}
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