"use client";

import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Code,
  Webhook,
  Gauge,
  Radio,
  ArrowRight,
  Copy,
  Check,
  Terminal,
  Braces,
  Rocket,
  Coffee,
} from "lucide-react";
import { useState } from "react";

function CodePreview() {
  const [copied, setCopied] = useState(false);

  const lines = [
    {
      text: "curl -X POST https://api.rofiant.ca/v1/chat/completions \\",
      color: "text-foreground-muted",
    },
    {
      text: '  -H "Authorization: Bearer rofiant_sk_... \\",',
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
    <div className=" border border-border bg-card overflow-hidden hover:border-border-light transition-colors">
      <div className="border-b border-border px-4 py-3 flex items-center gap-2">
        <div className="w-3 h-3  bg-red-500/80" />
        <div className="w-3 h-3  bg-yellow-500/80" />
        <div className="w-3 h-3  bg-green-500/80" />
        <span className="ml-3 text-xs text-foreground-muted font-mono">
          terminal
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
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [hoveredSdk, setHoveredSdk] = useState<number | null>(null);

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
    {
      icon: Code,
      title: "REST API",
      desc: "Clean, well-documented REST endpoints. Standard HTTP methods and JSON responses.",
      color: "text-accent-primary",
    },
    {
      icon: Webhook,
      title: "Webhooks",
      desc: "Get real-time notifications for events — agent completions, document processing, and more.",
      color: "text-accent-secondary",
    },
    {
      icon: Gauge,
      title: "Rate limiting",
      desc: "Built-in rate limiting and quota management. Control usage per user, team, or API key.",
      color: "text-accent-success",
    },
    {
      icon: Radio,
      title: "Streaming",
      desc: "Server-sent events for real-time token streaming. Low-latency responses for chat and agents.",
      color: "text-accent-warning",
    },
  ];

  return (
    <PageLayout
      badge="PLATFORM"
      badgeVariant="info"
      title="API"
      subtitle="Simple, powerful APIs for chat, voice, documents, and agents. SDKs for Python, TypeScript, Go, and more."
      hero={
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
          <CodePreview />
          <div>
            <h3 className="text-sm font-medium text-foreground-secondary mb-4">
              Quick install
            </h3>
            <div className="space-y-3">
              {sdks.map((sdk, index) => {
                const Icon = sdk.icon;
                return (
                  <div
                    key={sdk.lang}
                    className="group flex items-center justify-between bg-card border border-border  px-4 py-3 hover:border-border-light hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSdk(index)}
                    onMouseLeave={() => setHoveredSdk(null)}
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
      <PageSection title="Features">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
          {features.map((f, index) => {
            const Icon = f.icon;
            const isHovered = hoveredFeature === index;

            return (
              <div
                key={f.title}
                className="group"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <Card
                  variant="bordered"
                  className={`p-6 h-full transition-all duration-300 ${
                    isHovered
                      ? "border-border-light shadow-lg -translate-y-1"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 text-foreground-muted transition-all duration-300 ${
                        isHovered
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-2"
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-foreground-secondary">
                    {f.desc}
                  </p>
                </Card>
              </div>
            );
          })}
        </div>
      </PageSection>

      <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button size="lg" className="group">
          Read the docs
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
        </Button>
        <p className="text-sm text-foreground-muted">
          Full API reference available
        </p>
      </div>
    </PageLayout>
  );
}
