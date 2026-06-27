import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";

export default function APIReferencePage() {
  const endpoints = [
    {
      method: "POST",
      path: "/v1/chat/completions",
      desc: "Create a chat completion",
    },
    {
      method: "POST",
      path: "/v1/voice/transcribe",
      desc: "Transcribe audio to text",
    },
    {
      method: "POST",
      path: "/v1/documents/extract",
      desc: "Extract data from documents",
    },
    { method: "POST", path: "/v1/agents/run", desc: "Run a workflow assistant" },
    { method: "GET", path: "/v1/usage", desc: "Get usage statistics" },
    { method: "GET", path: "/v1/audit/logs", desc: "Query audit logs" },
  ];

  const methodColors: Record<string, string> = {
    GET: "text-accent-success",
    POST: "text-accent-secondary",
    PUT: "text-accent-warning",
    DELETE: "text-red-500",
  };

  return (
    <PageLayout
      badge="RESOURCES"
      title="API Reference"
      subtitle="Complete reference for all Rofiant API endpoints, parameters, and responses."
    >
      <div className="space-y-3">
        {endpoints.map((e) => (
          <Card
            key={e.path}
            variant="bordered"
            className="p-4 flex items-center gap-4"
          >
            <span
              className={`text-xs font-mono font-normal w-12 ${methodColors[e.method]}`}
            >
              {e.method}
            </span>
            <code className="text-sm font-mono text-foreground">{e.path}</code>
            <span className="ml-auto text-sm text-foreground-secondary">
              {e.desc}
            </span>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
