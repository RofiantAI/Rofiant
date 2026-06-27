"use client";

import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Wrench, UserCheck, Eye, ArrowRight, CheckCircle,
  Workflow, GitBranch, Shield, Clock, ChevronRight
} from "lucide-react";
import { useState } from "react";

function AgentFlow() {
  const steps = [
    { label: "Receive task", icon: "1", active: true },
    { label: "Plan steps", icon: "2", active: true },
    { label: "Search data", icon: "3", active: true },
    { label: "Await approval", icon: "4", active: false },
    { label: "Execute", icon: "5", active: false },
  ];

  return (
    <div className=" border border-border bg-card p-6 hover:border-border-light transition-colors">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center min-w-[80px]">
              <div className={`w-10 h-10  flex items-center justify-center text-sm font-normal transition-all ${step.active ? "bg-accent-primary text-black" : "bg-background-tertiary text-foreground-muted"}`}>
                {step.icon}
              </div>
              <span className="text-xs text-foreground-muted mt-2 text-center whitespace-nowrap">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 mx-1 transition-colors ${step.active ? "bg-accent-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 bg-background-tertiary  p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2  bg-accent-warning animate-pulse" />
          <span className="text-xs font-medium text-accent-warning">Waiting for approval</span>
        </div>
        <div className="text-sm text-foreground-secondary">
          <p className="font-medium text-foreground mb-1">Agent wants to execute:</p>
          <div className="bg-card border border-border  p-3 font-mono text-xs">
            <span className="text-accent-secondary">UPDATE</span>{" "}
            <span className="text-foreground">user_subscriptions</span>{" "}
            <span className="text-accent-secondary">SET</span>{" "}
            <span className="text-foreground">plan = &apos;pro&apos;</span>{" "}
            <span className="text-accent-secondary">WHERE</span>{" "}
            <span className="text-foreground">id = &apos;usr_123&apos;</span>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium bg-accent-success/10 text-accent-success  border border-accent-success/20 hover:bg-accent-success/20 transition-colors">Approve</button>
          <button className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400  border border-red-500/20 hover:bg-red-500/20 transition-colors">Deny</button>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Brain,
      title: "Multi-step reasoning",
      desc: "Agents break down complex tasks into steps, search for information, and synthesize results.",
      color: "text-accent-primary",
      details: [
        "Chain-of-thought reasoning with intermediate steps",
        "Self-correction when initial approach fails",
        "Parallel execution of independent sub-tasks",
        "Memory across long-running workflows",
      ],
    },
    {
      icon: Wrench,
      title: "Tool use",
      desc: "Connect agents to APIs, databases, and internal tools. They can take action, not just answer questions.",
      color: "text-accent-secondary",
      details: [
        "Call REST APIs, query SQL databases, search Elasticsearch",
        "Read and write files, send emails, create tickets",
        "Custom tools via Python or TypeScript SDK",
        "Tool execution sandboxed with timeout and retry",
      ],
    },
    {
      icon: UserCheck,
      title: "Human-in-the-loop",
      desc: "Set approval gates for sensitive actions. Agents pause and request confirmation before proceeding.",
      color: "text-accent-success",
      details: [
        "Define approval rules per tool or action type",
        "Route approvals to specific users or roles",
        "Timeout and fallback for unattended approvals",
        "Full audit trail of every approval decision",
      ],
    },
    {
      icon: Eye,
      title: "Full observability",
      desc: "See every step an agent takes. Replay, debug, and audit agent workflows in real time.",
      color: "text-accent-warning",
      details: [
        "Step-by-step execution trace with timing",
        "Cost tracking per workflow and user",
        "Error handling with automatic retry and escalation",
        "Export logs to SIEM or compliance tools",
      ],
    },
  ];

  const useCases = [
    {
      title: "IT Operations",
      desc: "Auto-remediate alerts, restart services, and create incident tickets — with approval for production changes.",
      icon: Workflow,
    },
    {
      title: "Customer Support",
      desc: "Auto-classify tickets, draft responses, and escalate complex issues — learning from past resolutions.",
      icon: Brain,
    },
    {
      title: "Finance",
      desc: "Reconcile accounts, flag anomalies, and generate reports — with audit trails for every calculation.",
      icon: Shield,
    },
  ];

  return (
    <PageLayout
      badge="PLATFORM"
      badgeVariant="info"
      title="AI Agents"
      subtitle="Deploy AI workflow assistants that handle multi-step tasks with approval gates, audit trails, and full observability."
      hero={<AgentFlow />}
    >
      <PageSection title="Capabilities" subtitle="Build agents that actually get work done.">
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

      <PageSection title="Use cases" subtitle="Agents that handle real work.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {useCases.map((u) => {
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

      <div className="mt-20 p-8  bg-card border border-border text-center">
        <h3 className="text-2xl font-semibold text-foreground mb-2">Ready to deploy AI workflow assistants?</h3>
        <p className="text-foreground-secondary mb-6">Start free. Build your first agent in under an hour.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="group">
            Start free trial
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button variant="outline" size="lg">Read the docs</Button>
        </div>
      </div>
    </PageLayout>
  );
}
