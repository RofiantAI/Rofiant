"use client";

import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send, Database, Shield, Globe, Clock, ArrowRight, CheckCircle,
  FileText, Search, Zap, MessageSquare, Lock, Plug, ChevronRight,
  Users
} from "lucide-react";
import { useState } from "react";

function ChatMockup() {
  const messages = [
    { role: "user", text: "What's our policy on remote work?" },
    {
      role: "assistant",
      text: "According to the Employee Handbook (Section 4.2), employees may work remotely up to 3 days per week with manager approval. Full-time remote requires VP sign-off.",
      source: "Employee Handbook v3.1",
    },
    { role: "user", text: "Does that apply to contractors?" },
    {
      role: "assistant",
      text: "No. Contractors follow a separate policy outlined in the Contractor Agreement (Section 7). Remote work terms are defined in each individual SOW.",
      source: "Contractor Agreement v2.4",
    },
  ];

  return (
    <div className=" border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-4 py-3 flex items-center gap-2">
        <div className="w-2 h-2  bg-accent-success animate-pulse" />
        <span className="text-sm font-medium text-foreground">Rofiant Chat</span>
        <span className="ml-auto text-xs text-foreground-muted">Connected to: Internal Wiki, HR Docs, Policies</span>
      </div>
      <div className="p-4 space-y-4 max-h-80 overflow-hidden">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              <div
                className={` px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-accent-secondary/20 text-foreground"
                    : "bg-background-tertiary text-foreground-secondary"
                }`}
              >
                {m.text}
              </div>
              {m.source && (
                <div className="mt-1 text-xs text-foreground-muted flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Source: {m.source}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 bg-background-tertiary  px-3 py-2">
          <span className="text-sm text-foreground-muted flex-1">Ask anything about your organization...</span>
          <Send className="w-4 h-4 text-foreground-muted" />
        </div>
      </div>
    </div>
  );
}

export default function ChatAIPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Database,
      title: "Custom knowledge base",
      desc: "Connect your documents, policies, and data. The AI answers from your content, not the open internet.",
      color: "text-accent-primary",
      details: [
        "Upload PDFs, Word docs, web pages, or connect to Confluence/Notion",
        "Auto-sync keeps answers current as docs change",
        "Source citations with page and paragraph references",
        "Handle common document formats",
      ],
    },
    {
      icon: Shield,
      title: "Role-based access",
      desc: "Control who sees what. Different users get different answers based on their permissions.",
      color: "text-accent-secondary",
      details: [
        "Sync with your identity provider (SAML, OAuth, OIDC)",
        "Document-level permissions per user or group",
        "Sensitive answers require approval before display",
        "Audit log of every access and response",
      ],
    },
    {
      icon: Globe,
      title: "Multi-language",
      desc: "Serve users in English, Spanish, Arabic, Mandarin, and more — automatically detected.",
      color: "text-accent-success",
      details: [
        "Auto-detect user language from message",
        "Multiple languages supported out of the box",
        "Translate answers while preserving technical terms",
        "Right-to-left language support (Arabic, Hebrew)",
      ],
    },
    {
      icon: Clock,
      title: "Full audit trail",
      desc: "Every conversation logged with user, timestamp, and response hash for compliance.",
      color: "text-accent-warning",
      details: [
        "Immutable conversation logs with tamper detection",
        "Export logs to SIEM or compliance tools",
        "Searchable by user, date, topic, or document",
        "Retention policies with automatic purging",
      ],
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Upload your docs",
      desc: "Drag and drop files or connect to Confluence, Notion, SharePoint, Google Drive. Rofiant indexes everything securely.",
    },
    {
      step: "02",
      title: "Configure access",
      desc: "Map your identity provider and set document permissions. Control who can ask what.",
    },
    {
      step: "03",
      title: "Start chatting",
      desc: "Users ask questions in natural language. Rofiant searches your docs and returns cited answers.",
    },
    {
      step: "04",
      title: "Monitor and improve",
      desc: "See what users are asking, identify knowledge gaps, and refine responses over time.",
    },
  ];

  const integrations = ["Slack", "Microsoft Teams", "Discord", "Web embed", "API", "Mobile SDK"];

  return (
    <PageLayout
      badge="PLATFORM"
      badgeVariant="info"
      title="Chat AI"
      subtitle="Deploy a ChatGPT-like experience customized to your data, policies, and workflows. Users get instant, cited answers from your knowledge base — not hallucinations from the internet."
      hero={
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Avg response", value: "<200ms", sub: "Under load" },
                { label: "Languages", value: "Multiple", sub: "Auto-detected" },
                { label: "Uptime SLA", value: "99.9%", sub: "Guaranteed" },
                { label: "Sources", value: "Unlimited", sub: "Per knowledge base" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border  p-4">
                  <div className="text-2xl font-normal text-foreground">{s.value}</div>
                  <div className="text-sm text-foreground mt-1">{s.label}</div>
                  <div className="text-xs text-foreground-muted">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">What users ask</h4>
              {[
                "What is our vacation policy?",
                "How do I submit an expense report?",
                "Who is the DRI for Project Titan?",
                "Summarize the Q3 all-hands deck",
              ].map((q) => (
                <div key={q} className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <MessageSquare className="w-3 h-3 text-foreground-muted" />
                  {q}
                </div>
              ))}
            </div>
          </div>
          <ChatMockup />
        </div>
      }
    >
      {/* How it works */}
      <PageSection title="How it works" subtitle="From documents to answers in minutes.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {howItWorks.map((h) => (
            <div key={h.step} className="relative">
              <div className="text-5xl font-bold text-foreground/5">{h.step}</div>
              <h3 className="text-lg font-semibold text-foreground -mt-6 mb-2">{h.title}</h3>
              <p className="text-sm text-foreground-secondary leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Features */}
      <PageSection title="Capabilities" subtitle="Everything you need for secure, accurate AI chat.">
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
                  className={`p-6 h-full transition-all duration-300 ${isHovered ? "border-border-light shadow-lg -translate-y-1" : ""}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight className={`w-4 h-4 text-foreground-muted transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`} />
                  </div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-foreground-secondary mb-4">{f.desc}</p>
                  <ul className="space-y-2">
                    {f.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                        <ChevronRight className="w-3 h-3 text-foreground-muted/50 shrink-0 mt-1" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            );
          })}
        </div>
      </PageSection>

      {/* Integrations */}
      <PageSection title="Integrations" subtitle="Deploy where your users already are.">
        <div className="mt-8 flex flex-wrap gap-3">
          {integrations.map((tool) => (
            <Badge key={tool} variant="default" className="px-4 py-2 text-sm">
              {tool}
            </Badge>
          ))}
        </div>
      </PageSection>

      {/* Security */}
      <PageSection title="Security" subtitle="Enterprise-grade from the start.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {[
            "SOC 2 Type II in progress",
            "End-to-end encryption (AES-256 + TLS 1.3)",
            "Customer-managed encryption keys",
            "Immutable audit logs for every conversation",
            "SSO via SAML 2.0, OAuth 2.0, OIDC",
            "Role-based access at document level",
            "Data residency: US and EU",
            "99.9% uptime SLA with public status page",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 p-4  bg-background-tertiary">
              <CheckCircle className="w-4 h-4 text-accent-success shrink-0" />
              <span className="text-sm text-foreground-secondary">{item}</span>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Use cases */}
      <PageSection title="Use cases" subtitle="What teams do with Rofiant Chat.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            { title: "HR & People", desc: "Answer policy questions, onboard new hires, and handle benefits inquiries automatically.", icon: Users },
            { title: "IT Support", desc: "Troubleshoot common issues, route tickets, and search runbooks without leaving Slack.", icon: Zap },
            { title: "Legal & Compliance", desc: "Search contracts, policies, and regulations with source citations for every answer.", icon: Lock },
          ].map((u) => {
            const Icon = u.icon;
            return (
              <Card key={u.title} variant="bordered" className="p-6">
                <Icon className="w-6 h-6 text-foreground-muted mb-3" />
                <h3 className="font-semibold text-foreground">{u.title}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">{u.desc}</p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* CTA */}
      <div className="mt-20 p-8  bg-card border border-border text-center">
        <h3 className="text-2xl font-semibold text-foreground mb-2">Ready to deploy AI chat for your team?</h3>
        <p className="text-foreground-secondary mb-6">Start free with up to 10 users. No credit card required.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="group">
            Start free trial
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button variant="outline" size="lg">Talk to sales</Button>
        </div>
      </div>
    </PageLayout>
  );
}
