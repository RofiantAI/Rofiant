"use client";

import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, FileSearch, Radio, Shield, ArrowRight, CheckCircle, AlertTriangle, Server } from "lucide-react";
import { useState } from "react";

export default function DefenseIntelligencePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [hoveredDeployment, setHoveredDeployment] = useState<number | null>(null);

  const features = [
    {
      icon: Lock,
      title: "Air-gapped deployments",
      desc: "Full functionality on classified networks without internet connectivity.",
      color: "text-accent-primary",
    },
    {
      icon: FileSearch,
      title: "Document intelligence",
      desc: "Process intelligence reports, briefings, and open-source documents at scale with RAG-powered search.",
      color: "text-accent-secondary",
    },
    {
      icon: Radio,
      title: "Voice transcription",
      desc: "Real-time transcription and summarization for briefings, meetings, and field recordings.",
      color: "text-accent-success",
    },
    {
      icon: Shield,
      title: "Audit and compliance",
      desc: "Complete audit trails for every AI interaction. Exportable logs for compliance and oversight.",
      color: "text-accent-warning",
    },
  ];

  const deployments = [
    { env: "Cloud (AWS GovCloud)", status: "Available", icon: Server },
    { env: "Cloud (Azure Government)", status: "Available", icon: Server },
    { env: "On-premises", status: "Available", icon: Server },
    { env: "Air-gapped", status: "Available", icon: Lock },
    { env: "Classified (SIPR/NIPR)", status: "Contact us", icon: AlertTriangle },
  ];

  return (
    <PageLayout
      badge="SOLUTIONS"
      badgeVariant="success"
      title="Defense & Intelligence"
      subtitle="AI capabilities for defense and intelligence missions. Deployed in classified and restricted environments."
      hero={
        <div className="bg-card border border-border  p-6 hover:border-border-light transition-colors">
          <h3 className="text-sm font-medium text-foreground-secondary mb-4 flex items-center gap-2">
            <Server className="w-4 h-4" />
            Deployment environments
          </h3>
          <div className="space-y-3">
            {deployments.map((d, index) => {
              const Icon = d.icon;
              const isHovered = hoveredDeployment === index;

              return (
                <div 
                  key={d.env} 
                  className={`flex items-center justify-between p-3  transition-colors cursor-pointer ${
                    isHovered ? "bg-background-tertiary" : ""
                  }`}
                  onMouseEnter={() => setHoveredDeployment(index)}
                  onMouseLeave={() => setHoveredDeployment(null)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-foreground-muted" />
                    <span className="text-sm text-foreground">{d.env}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.status === "Available" ? (
                      <CheckCircle className="w-4 h-4 text-accent-success" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-accent-warning" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        d.status === "Available"
                          ? "text-accent-success"
                          : "text-accent-warning"
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      }
    >
      <PageSection title="Mission capabilities">
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
