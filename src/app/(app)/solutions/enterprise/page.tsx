"use client";

import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Workflow, Users, Shield, ArrowRight,
  CheckCircle, Lock, Zap, BarChart3, Clock, Server, Plug,
  FileText, Search, Code, Globe, ChevronRight
} from "lucide-react";
import { useState } from "react";

export default function EnterprisePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      icon: MessageSquare,
      title: "Knowledge assistant",
      desc: "Deploy a ChatGPT-like assistant trained on your internal docs, wikis, and policies. Answers are grounded in your data, not the open internet.",
      color: "text-accent-primary",
      details: [
        "Connect to Confluence, Notion, SharePoint, or upload docs directly",
        "Answers include source citations with page references",
        "Supports major languages for global teams",
        "Retention policies keep responses current as docs change",
      ],
    },
    {
      icon: Workflow,
      title: "Workflow automation",
      desc: "Build AI agents that handle repetitive tasks — routing requests, summarizing reports, updating records.",
      color: "text-accent-secondary",
      details: [
        "Visual workflow builder, no code required",
        "Trigger from email, Slack, webhooks, or schedule",
        "Built-in approval gates for sensitive actions",
        "Audit trail for every automated decision",
      ],
    },
    {
      icon: Users,
      title: "Team collaboration",
      desc: "Shared workspaces, conversation history, and collaborative AI sessions for teams.",
      color: "text-accent-success",
      details: [
        "Shared threads with @mentions and comments",
        "Templates for common workflows per team",
        "Conversation history searchable across the org",
        "Real-time collaborative editing with AI suggestions",
      ],
    },
    {
      icon: Shield,
      title: "SSO and RBAC",
      desc: "Integrate with your existing identity provider. Control access by team, role, and department.",
      color: "text-accent-warning",
      details: [
        "SAML 2.0, OAuth 2.0, OIDC support",
        "Granular permissions at document and feature level",
        "Audit logs for every access and action",
        "Auto-provision and de-provision users via SCIM",
      ],
    },
  ];

  const useCases = [
    {
      team: "Engineering",
      icon: Code,
      color: "text-blue-400",
      items: [
        "Search across all internal documentation, runbooks, and code repos",
        "Auto-generate incident post-mortems from Slack threads and logs",
        "Review PRs with AI-suggested improvements and security checks",
        "Onboard new engineers with interactive Q&A on codebase and practices",
      ],
    },
    {
      team: "Legal",
      icon: FileText,
      color: "text-purple-400",
      items: [
        "Analyze contracts against your clause library and flag risks",
        "Search across executed agreements by party, term, or obligation",
        "Auto-generate NDAs and standard agreements from templates",
        "Track compliance deadlines and renewal dates automatically",
      ],
    },
    {
      team: "Sales",
      icon: BarChart3,
      color: "text-green-400",
      items: [
        "Generate personalized proposals from CRM data and product docs",
        "Get competitive battlecards pulled from internal intel and win/loss data",
        "Draft follow-up emails with context from every call and meeting",
        "Forecast pipeline health with AI analysis of deal signals",
      ],
    },
    {
      team: "Support",
      icon: MessageSquare,
      color: "text-yellow-400",
      items: [
        "Instant answers from knowledge base, reducing repetitive ticket volume",
        "Auto-suggest macros and responses based on ticket history",
        "Route complex issues to the right team with AI classification",
        "Summarize long ticket threads for faster handoffs",
      ],
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Connect your data",
      desc: "Integrate with your existing tools — Google Drive, Confluence, Slack, Salesforce, or upload files directly. Rofiant indexes everything securely.",
    },
    {
      step: "02",
      title: "Configure access",
      desc: "Map your existing identity provider. Set role-based permissions so teams only see what they are allowed to see. Full audit trail from day one.",
    },
    {
      step: "03",
      title: "Deploy to teams",
      desc: "Launch via web app, Slack, Teams, or embed in your existing tools. Users start asking questions and automating workflows immediately.",
    },
    {
      step: "04",
      title: "Scale and optimize",
      desc: "Monitor usage, refine responses, and build custom workflows. Add new data sources and teams as you grow.",
    },
  ];

  const deploymentOptions = [
    { name: "Cloud", desc: "Fully managed, scales automatically", icon: Server },
    { name: "VPC", desc: "Isolated infrastructure in your AWS/Azure account", icon: Lock },
    { name: "On-premises", desc: "Run in your own data center", icon: Server },
  ];

  return (
    <PageLayout
      badge="SOLUTIONS"
      badgeVariant="success"
      title="Enterprise AI"
      subtitle="Deploy secure, compliant AI across your organization. One platform for knowledge search, workflow automation, and team collaboration — with the security controls enterprises require."
      hero={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Uptime", value: "99.9%", sub: "SLA guaranteed" },
            { label: "Setup time", value: "< 1 day", sub: "To first deployment" },
            { label: "Deployment", value: "Managed cloud", sub: "US & EU regions" },
            { label: "Support", value: "24/7", sub: "Enterprise plans" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border  p-5 text-center">
              <div className="text-3xl font-normal text-foreground">{stat.value}</div>
              <div className="text-sm text-foreground mt-1">{stat.label}</div>
              <div className="text-xs text-foreground-muted">{stat.sub}</div>
            </div>
          ))}
        </div>
      }
    >
      {/* How it works */}
      <PageSection title="How it works" subtitle="From signup to production in under 24 hours.">
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

      {/* Use cases by team */}
      <PageSection title="By team" subtitle="Every department gets value from day one.">
        <div className="mt-8 border border-border  overflow-hidden">
          <div className="flex border-b border-border">
            {useCases.map((u, i) => {
              const Icon = u.icon;
              return (
                <button
                  key={u.team}
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    i === activeTab
                      ? "text-foreground bg-background-secondary"
                      : "text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${i === activeTab ? u.color : ""}`} />
                  {u.team}
                </button>
              );
            })}
          </div>
          <div className="p-8">
            <ul className="space-y-4">
              {useCases[activeTab].items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-success shrink-0 mt-0.5" />
                  <span className="text-foreground-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PageSection>

      {/* Features with details */}
      <PageSection title="Platform capabilities" subtitle="Built for enterprise scale and security.">
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

      {/* Deployment */}
      <PageSection title="Deployment options" subtitle="Run Rofiant where your data lives.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {deploymentOptions.map((d) => {
            const Icon = d.icon;
            return (
              <Card key={d.name} variant="bordered" className="p-6">
                <Icon className="w-6 h-6 text-foreground-muted mb-3" />
                <h3 className="font-semibold text-foreground">{d.name}</h3>
                <p className="mt-1 text-sm text-foreground-secondary">{d.desc}</p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* Integrations */}
      <PageSection title="Integrations" subtitle="Works with the tools you already use.">
        <div className="mt-8 flex flex-wrap gap-3">
          {["Slack", "Microsoft Teams", "Salesforce", "Jira", "Confluence", "Notion", "Google Drive", "SharePoint", "Zendesk", "GitHub"].map((tool) => (
            <Badge key={tool} variant="default" className="px-4 py-2 text-sm">
              {tool}
            </Badge>
          ))}
        </div>
      </PageSection>

      {/* Security */}
      <PageSection title="Security & compliance" subtitle="Enterprise-grade from day one.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {[
            "SOC 2 Type II in progress",
            "GDPR and CCPA compliant",
            "Data encrypted at rest (AES-256) and in transit (TLS 1.3)",
            "Customer-managed encryption keys available",
            "Granular audit logs, exportable and immutable",
            "SSO via SAML 2.0, OAuth 2.0, OIDC",
            "Role-based access control at document level",
            "99.9% uptime SLA with public status page",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 p-4  bg-background-tertiary">
              <CheckCircle className="w-4 h-4 text-accent-success shrink-0" />
              <span className="text-sm text-foreground-secondary">{item}</span>
            </div>
          ))}
        </div>
      </PageSection>

      {/* CTA */}
      <div className="mt-20 p-8  bg-card border border-border text-center">
        <h3 className="text-2xl font-semibold text-foreground mb-2">Ready to deploy AI across your organization?</h3>
        <p className="text-foreground-secondary mb-6">Start with a pilot team. Scale to the whole company when you are ready.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="group">
            Start free trial
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button variant="outline" size="lg">Talk to sales</Button>
        </div>
        <p className="mt-4 text-xs text-foreground-muted">No credit card required. Free for up to 10 users.</p>
      </div>
    </PageLayout>
  );
}
