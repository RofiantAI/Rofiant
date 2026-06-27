"use client";

import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Radio, FileOutput, Shield, ArrowRight, Clock, Zap, BarChart3 } from "lucide-react";
import { useState } from "react";

export default function LawEnforcementPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: FileText,
      title: "Case file analysis",
      desc: "Search and summarize case files, incident reports, and evidence documents in seconds.",
      color: "text-accent-primary",
    },
    {
      icon: Radio,
      title: "Transcript analysis",
      desc: "Analyze interview recordings, radio communications, and witness statements. Extract key details and timestamps.",
      color: "text-accent-secondary",
    },
    {
      icon: FileOutput,
      title: "Report generation",
      desc: "Auto-generate reports from notes, transcripts, and structured data. Reduce paperwork, increase field time.",
      color: "text-accent-success",
    },
    {
      icon: Shield,
      title: "Chain of custody",
      desc: "Every AI interaction logged with user, timestamp, and full reasoning trail for courtroom defensibility.",
      color: "text-accent-warning",
    },
  ];

  const metrics = [
    { metric: "Faster", label: "Report drafting", icon: BarChart3, color: "text-blue-400" },
    { metric: "< 2s", label: "Document search", icon: Zap, color: "text-yellow-400" },
    { metric: "Full", label: "Audit trail coverage", icon: Clock, color: "text-green-400" },
  ];

  return (
    <PageLayout
      badge="SOLUTIONS"
      badgeVariant="success"
      title="Law Enforcement"
      subtitle="AI tools for law enforcement agencies. Case management, document analysis, and report generation — all with full audit trails."
      hero={
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {metrics.map((s) => {
            const Icon = s.icon;

            return (
              <div
                key={s.label}
                className="group bg-card border border-border  p-5 text-center hover:border-border-light hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-normal text-foreground group-hover:text-accent-primary transition-colors">
                  {s.metric}
                </div>
                <div className="text-xs text-foreground-muted mt-1">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      }
    >
      <PageSection title="Capabilities">
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
                    isHovered ? "border-border-light shadow-lg -translate-y-1" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 text-foreground-muted transition-all duration-300 ${
                        isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-foreground-secondary">{f.desc}</p>
                </Card>
              </div>
            );
          })}
        </div>
      </PageSection>

      <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button size="lg" className="group">
          Talk to sales
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
        </Button>
        <p className="text-sm text-foreground-muted">Custom deployment available</p>
      </div>
    </PageLayout>
  );
}
