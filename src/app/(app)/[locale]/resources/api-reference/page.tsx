import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function APIReferencePage() {
  const t = await getTranslations("resources.apiReference");

  const endpoints = [
    {
      method: "POST",
      path: "/v1/chat/completions",
      desc: t("endpoints.chatCompletions"),
    },
    { method: "GET", path: "/v1/models", desc: t("endpoints.models") },
    { method: "GET", path: "/v1/usage", desc: t("endpoints.usage") },
    { method: "GET", path: "/v1/audit/logs", desc: t("endpoints.auditLogs") },
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
      title={t("title")}
      subtitle={t("subtitle")}
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
