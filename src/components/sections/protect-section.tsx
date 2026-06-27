"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, Key, FileText, ChevronRight, Lock, Eye } from "lucide-react";
import { useState } from "react";

const features = [
  {
    id: "identity",
    icon: Key,
    title: "Identity & access control",
    subtitle: "SSO and role-based access built in",
    description:
      "Integrate with your existing identity provider. SAML SSO, OAuth, and granular role-based access control out of the box.",
    panel: <IdentityPanel />,
  },
  {
    id: "audit",
    icon: FileText,
    title: "Audit everything",
    subtitle: "Every action logged, every decision traceable",
    description:
      "Complete audit trails for every AI interaction. Meet compliance requirements with immutable, exportable logs.",
    panel: <AuditPanel />,
  },
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
          { method: "SAML 2.0 SSO", status: "Active", icon: Key },
          { method: "OAuth 2.0 / OIDC", status: "Active", icon: Shield },
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
  const [hoveredLog, setHoveredLog] = useState<number | null>(null);
  
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
        <Badge variant="default" className="animate-pulse">Live</Badge>
      </div>
      <div className="divide-y divide-border">
        {logs.map((log, index) => (
          <div 
            key={log.time} 
            className={`p-3 transition-colors cursor-pointer ${
              hoveredLog === index ? "bg-background-tertiary/50" : ""
            }`}
            onMouseEnter={() => setHoveredLog(index)}
            onMouseLeave={() => setHoveredLog(null)}
          >
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
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Badge variant="success" dot className="mb-4">
            SECURITY
          </Badge>
          <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
            Enterprise-grade security.{" "}
            <span className="text-foreground-secondary">
              Built in, not bolted on.
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-foreground-secondary">
            Authenticate with your existing identity provider. Maintain complete audit trails for every interaction.
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
                  className={`w-full text-left p-4  transition-all duration-200 ${
                    isActive
                      ? "bg-card border border-border-light shadow-lg"
                      : "hover:bg-card/50"
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
                        {f.title}
                      </h3>
                      <p className="text-sm text-foreground-muted mt-0.5">
                        {f.subtitle}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ml-auto shrink-0 transition-all ${
                      isActive ? "text-foreground rotate-90" : "text-foreground-muted"
                    }`} />
                  </div>
                  {isActive && (
                    <p className="mt-3 text-sm text-foreground-secondary leading-relaxed">
                      {f.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feature panel */}
          <div className="transition-all duration-300">
            {features[activeFeature].panel}
          </div>
        </div>
      </div>
    </section>
  );
}
