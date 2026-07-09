"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Code,
  Webhook,
  Gauge,
  Radio,
  Copy,
  Check,
  Terminal,
  Braces,
  Rocket,
  Coffee,
} from "lucide-react";
import { useState } from "react";

function CodePreview() {
  const t = useTranslations("platform.api");
  const [copied, setCopied] = useState(false);

  const lines = [
    {
      text: "curl -X POST https://api.rofiant.ca/v1/chat/completions \\",
      color: "text-foreground-muted",
    },
    {
      text: '  -H "Authorization: Bearer sk_... \\",',
      color: "text-foreground-muted",
    },
    {
      text: '  -H "Content-Type: application/json" \\',
      color: "text-foreground-muted",
    },
    { text: "  -d '{", color: "text-foreground-muted" },
    {
      text: '    "model": "groq-llama-3.3-70b",',
      color: "text-accent-primary",
    },
    { text: '    "messages": [', color: "text-foreground" },
    { text: "      {", color: "text-foreground" },
    { text: '        "role": "user",', color: "text-accent-secondary" },
    {
      text: '        "content": "Summarize the quarterly report"',
      color: "text-accent-secondary",
    },
    { text: "      }", color: "text-foreground" },
    { text: "    ],", color: "text-foreground" },
    { text: '    "stream": true', color: "text-accent-primary" },
    { text: "  }'", color: "text-foreground-muted" },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(lines.map((l) => l.text).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className=" border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-4 py-3 flex items-center gap-2">
        <div className="w-3 h-3  bg-red-500/80" />
        <div className="w-3 h-3  bg-yellow-500/80" />
        <div className="w-3 h-3  bg-green-500/80" />
        <span className="ml-3 text-xs text-foreground-muted font-mono">
          {t("terminalLabel")}
        </span>
        <button
          onClick={handleCopy}
          className="ml-auto p-1.5  hover:bg-background-tertiary transition-colors"
        >
          {copied ? (
            <Check className="w-3 h-3 text-accent-success" />
          ) : (
            <Copy className="w-3 h-3 text-foreground-muted" />
          )}
        </button>
      </div>
      <div className="p-4 font-mono text-sm leading-6 overflow-x-auto">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="w-8 text-right pr-4 text-foreground-muted/40 select-none shrink-0">
              {i + 1}
            </span>
            <span className={line.color}>{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function APIPage() {
  const t = useTranslations("platform.api");

  const sdks = [
    { lang: "Python", install: "pip install rofiant-ai", icon: Terminal },
    { lang: "TypeScript", install: "npm install @rofiant/sdk", icon: Braces },
    { lang: "Go", install: "go get github.com/rofiant/sdk-go", icon: Rocket },
    {
      lang: "Java",
      install: "implementation 'ai.rofiant:client'",
      icon: Coffee,
    },
  ];

  const features = [
    { key: "restApi", icon: Code, color: "text-accent-primary" },
    { key: "webhooks", icon: Webhook, color: "text-accent-secondary" },
    { key: "rateLimiting", icon: Gauge, color: "text-accent-success" },
    { key: "streaming", icon: Radio, color: "text-accent-warning" },
  ] as const;

  return (
    <PageLayout
      badge={t("badge")}
      badgeVariant="info"
      title={t("title")}
      subtitle={t("subtitle")}
      hero={
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
          <CodePreview />
          <div>
            <h3 className="text-sm font-medium text-foreground-secondary mb-4">
              {t("quickInstall")}
            </h3>
            <div className="space-y-3">
              {sdks.map((sdk) => {
                const Icon = sdk.icon;
                return (
                  <div
                    key={sdk.lang}
                    className="flex items-center justify-between bg-card border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium text-foreground">
                        {sdk.lang}
                      </span>
                    </div>
                    <code className="text-sm font-mono text-foreground-muted">
                      {sdk.install}
                    </code>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      }
    >
      <PageSection title={t("featuresTitle")}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
          {features.map((f) => {
            const Icon = f.icon;

            return (
              <Card key={f.key} variant="bordered" className="p-6 h-full">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{t(`features.${f.key}.title`)}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {t(`features.${f.key}.desc`)}
                </p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/resources/api-reference">
          <Button size="lg">{t("readDocs")}</Button>
        </Link>
        <p className="text-sm text-foreground-muted">
          {t("fullReference")}
        </p>
      </div>
    </PageLayout>
  );
}
