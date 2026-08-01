"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain, Wrench, UserCheck, Eye, CheckCircle,
  Workflow, GitBranch, Shield, Clock, ChevronRight
} from "lucide-react";
import { useState } from "react";

type FlowStatus = "pending" | "approved" | "denied";

function AgentFlow() {
  const t = useTranslations("platform.agents.flow");
  const [status, setStatus] = useState<FlowStatus>("pending");

  const steps = [
    { key: "receive", icon: "1" },
    { key: "plan", icon: "2" },
    { key: "search", icon: "3" },
    { key: "approval", icon: "4" },
    { key: "execute", icon: "5" },
  ] as const;
  const activeCount = status === "approved" ? 5 : status === "denied" ? 3 : 4;

  return (
    <div className=" border border-border bg-card p-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const active = i < activeCount;
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center min-w-[80px]">
                <div className={`w-10 h-10  flex items-center justify-center text-sm font-normal transition-all ${active ? "bg-accent-primary text-black" : "bg-background-tertiary text-foreground-muted"}`}>
                  {step.icon}
                </div>
                <span className="text-xs text-foreground-muted mt-2 text-center whitespace-nowrap">{t(`steps.${step.key}`)}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-8 mx-1 transition-colors ${i < activeCount - 1 ? "bg-accent-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 bg-background-tertiary  p-4">
        <div className="flex items-center gap-2 mb-3">
          {status === "pending" && (
            <>
              <div className="w-2 h-2 bg-accent-warning" />
              <span className="text-xs font-medium text-accent-warning">{t("waiting")}</span>
            </>
          )}
          {status === "approved" && (
            <>
              <div className="w-2 h-2  bg-accent-success" />
              <span className="text-xs font-medium text-accent-success">{t("approved")}</span>
            </>
          )}
          {status === "denied" && (
            <>
              <div className="w-2 h-2  bg-red-400" />
              <span className="text-xs font-medium text-red-400">{t("denied")}</span>
            </>
          )}
        </div>
        <div className="text-sm text-foreground-secondary">
          <p className="font-medium text-foreground mb-1">{t("wantsToExecute")}</p>
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
          <button
            onClick={() => setStatus("approved")}
            disabled={status !== "pending"}
            className="px-3 py-1.5 text-xs font-medium bg-accent-success/10 text-accent-success  border border-accent-success/20 hover:bg-accent-success/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {t("approve")}
          </button>
          <button
            onClick={() => setStatus("denied")}
            disabled={status !== "pending"}
            className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400  border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {t("deny")}
          </button>
          {status !== "pending" && (
            <button
              onClick={() => setStatus("pending")}
              className="px-3 py-1.5 text-xs font-medium text-foreground-muted border border-border hover:border-border-light transition-colors"
            >
              {t("reset")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const t = useTranslations("platform.agents");

  const features = [
    { key: "reasoning", icon: Brain, color: "text-accent-primary" },
    { key: "toolUse", icon: Wrench, color: "text-accent-secondary" },
    { key: "humanInLoop", icon: UserCheck, color: "text-accent-success" },
    { key: "observability", icon: Eye, color: "text-accent-warning" },
  ] as const;

  const useCases = [
    { key: "itOps", icon: Workflow },
    { key: "support", icon: Brain },
    { key: "finance", icon: Shield },
  ] as const;

  return (
    <PageLayout
      badge={t("badge")}
      badgeVariant="info"
      title={t("title")}
      subtitle={t("subtitle")}
      hero={<AgentFlow />}
    >
      <p className="text-sm text-foreground-muted border border-border bg-background-tertiary px-4 py-3">
        {t("roadmapNotice")}
      </p>
      <PageSection title={t("capabilities.title")} subtitle={t("capabilities.subtitle")}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
          {features.map((f) => {
            const Icon = f.icon;
            const details = t.raw(`features.${f.key}.details`) as string[];
            return (
              <Card key={f.key} variant="bordered" className="p-6 h-full">
                <div className="mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground">{t(`features.${f.key}.title`)}</h3>
                <p className="mt-2 text-sm text-foreground-secondary mb-4">{t(`features.${f.key}.desc`)}</p>
                <ul className="space-y-2">
                  {details.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                      <ChevronRight className="w-3 h-3 text-foreground-muted/50 shrink-0 mt-1" />
                      {d}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </PageSection>

      <PageSection title={t("useCasesSection.title")} subtitle={t("useCasesSection.subtitle")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {useCases.map((u) => {
            const Icon = u.icon;
            return (
              <Card key={u.key} variant="bordered" className="p-6">
                <Icon className="w-6 h-6 text-foreground-muted mb-3" />
                <h3 className="font-semibold text-foreground">{t(`useCases.${u.key}.title`)}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">{t(`useCases.${u.key}.desc`)}</p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      <div className="mt-20 p-8  bg-card border border-border text-center">
        <h3 className="text-2xl font-semibold text-foreground mb-2">{t("cta.title")}</h3>
        <p className="text-foreground-secondary mb-6">{t("cta.subtitle")}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg">{t("cta.startTrial")}</Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
