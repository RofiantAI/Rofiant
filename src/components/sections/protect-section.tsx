"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Key, FileText, ChevronRight, Lock, Eye } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

const features = [
  { id: "identity", icon: Key, panel: <IdentityPanel /> },
  { id: "audit", icon: FileText, panel: <AuditPanel /> },
] as const;

function IdentityPanel() {
  return (
    <Card variant="elevated" className="bg-background-secondary border-border">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Lock className="w-4 h-4 text-foreground-muted" />
        <h4 className="text-sm font-semibold text-foreground">
          Authentication Methods
        </h4>
      </div>
      <div className="divide-y divide-border">
        {[
          { method: "API Key", status: "Available", icon: FileText },
          { method: "Session Token", status: "Available", icon: Eye },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.method}
              className="flex items-center justify-between p-4 hover:bg-background-tertiary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-foreground-muted" />
                <span className="text-sm">{item.method}</span>
              </div>
              <Badge
                variant={item.status === "Active" ? "success" : "default"}
                dot={item.status === "Active"}
              >
                {item.status}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AuditPanel() {
  const logs = [
    { time: "14:32:01", user: "jane.doe", action: "Query: Q3 revenue summary" },
    {
      time: "14:31:45",
      user: "john.smith",
      action: "Document upload: report.pdf",
    },
    { time: "14:31:22", user: "system", action: "Agent workflow completed" },
    { time: "14:30:58", user: "api", action: "Voice session initiated" },
  ];

  return (
    <Card variant="elevated" className="bg-background-secondary border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Eye className="w-4 h-4 text-foreground-muted" />
          Audit Trail
        </h4>
        <Badge variant="default">Live</Badge>
      </div>
      <div className="divide-y divide-border">
        {logs.map((log) => (
          <div key={log.time} className="p-3">
            <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
              <span className="font-mono">{log.time}</span>
              <span>·</span>
              <span className="text-accent-secondary">{log.user}</span>
            </div>
            <p className="text-sm text-foreground">{log.action}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ProtectSection() {
  const t = useTranslations("home.protect");
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Badge variant="success" dot className="mb-4">
            {t("badge")}
          </Badge>
          <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
            {t("titlePrefix")}{" "}
            <span className="text-foreground-secondary">
              {t("titleHighlight")}
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-foreground-secondary">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
          {/* Feature selector */}
          <div className="space-y-2">
            {features.map((f, index) => {
              const Icon = f.icon;
              const isActive = activeFeature === index;
              
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFeature(index)}
                  className={`w-full text-left p-4 border ${
                    isActive
                      ? "bg-card border-border"
                      : "border-transparent bg-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? "text-accent-primary" : "text-foreground-muted"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-semibold transition-colors ${
                        isActive ? "text-foreground" : "text-foreground-secondary"
                      }`}>
                        {t(`features.${f.id}.title`)}
                      </h3>
                      <p className="text-sm text-foreground-muted mt-0.5">
                        {t(`features.${f.id}.subtitle`)}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ml-auto shrink-0 transition-all ${
                      isActive ? "text-foreground rotate-90" : "text-foreground-muted"
                    }`} />
                  </div>
                  {isActive && (
                    <p className="mt-3 text-sm text-foreground-secondary leading-relaxed">
                      {t(`features.${f.id}.description`)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feature panel */}
          <div>
            {features[activeFeature].panel}
          </div>
        </div>
      </div>
    </section>
  );
}
