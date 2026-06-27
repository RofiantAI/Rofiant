"use client";

import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Rocket, MessageSquare, Mic, FileText, Brain, Puzzle, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function DocumentationPage() {
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);

  const sections = [
    { icon: Rocket, title: "Getting Started", desc: "Quick start guides, authentication, and your first API call.", color: "text-accent-primary" },
    { icon: MessageSquare, title: "Chat AI", desc: "Build conversational AI experiences with Rofiant Chat.", color: "text-accent-secondary" },
    { icon: Mic, title: "Voice AI", desc: "Real-time transcription, summarization, and voice-driven workflows.", color: "text-accent-success" },
    { icon: FileText, title: "Document Intelligence", desc: "Extract, classify, and search across documents with RAG.", color: "text-accent-warning" },
    { icon: Brain, title: "Agents", desc: "Deploy workflow assistants with multi-step reasoning and API connectors.", color: "text-accent-orange" },
    { icon: Puzzle, title: "Integrations", desc: "Connect Rofiant to Slack, Jira, CRM, and custom systems.", color: "text-blue-400" },
    { icon: Shield, title: "Security", desc: "Authentication, RBAC, encryption, and audit logging.", color: "text-purple-400" },
  ];

  return (
    <PageLayout
      badge="RESOURCES"
      title="Documentation"
      subtitle="Everything you need to build with Rofiant. Guides, tutorials, and reference docs."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((s, index) => {
          const Icon = s.icon;
          const isHovered = hoveredSection === index;

          return (
            <div
              key={s.title}
              className="group"
              onMouseEnter={() => setHoveredSection(index)}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <Card
                variant="bordered"
                className={`p-6 h-full transition-all duration-300 cursor-pointer ${
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
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">{s.desc}</p>
              </Card>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
