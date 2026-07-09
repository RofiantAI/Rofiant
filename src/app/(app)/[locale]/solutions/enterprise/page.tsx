"use client";

import { Link } from "@/i18n/navigation";
import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Workflow, Users, Shield,
  CheckCircle, Lock, Server,
  FileText, Code, BarChart3, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

const featureMeta = [
  { key: "knowledgeAssistant", icon: MessageSquare },
  { key: "workflowAutomation", icon: Workflow },
  { key: "teamCollaboration", icon: Users },
  { key: "ssoRbac", icon: Shield },
] as const;

const useCaseMeta = [
  { key: "engineering", icon: Code, color: "text-blue-400" },
  { key: "legal", icon: FileText, color: "text-purple-400" },
  { key: "sales", icon: BarChart3, color: "text-green-400" },
  { key: "support", icon: MessageSquare, color: "text-yellow-400" },
] as const;

const howItWorksMeta = ["connect", "configure", "deploy", "scale"] as const;

const deploymentOptionMeta = [
  { key: "awsCloud", icon: Server },
  { key: "azureCloud", icon: Server },
  { key: "gcpCloud", icon: Server },
  { key: "sovereignCloud", icon: Lock },
  { key: "vpc", icon: Lock },
  { key: "onPremises", icon: Server },
] as const;

export default function EnterprisePage() {
  const t = useTranslations("solutions.enterprise");
  const [activeTab, setActiveTab] = useState(0);

  const stats = t.raw("stats") as { label: string; value: string; sub: string }[];
  const security = t.raw("security") as string[];

  return (
    <PageLayout
      badge={t("badge")}
      badgeVariant="success"
      title={t("title")}
      subtitle={t("subtitle")}
      hero={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
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
      <PageSection title={t("howItWorksSection.title")} subtitle={t("howItWorksSection.subtitle")}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {howItWorksMeta.map((key) => (
            <div key={key} className="relative">
              <div className="text-5xl font-bold text-foreground/5">{t(`howItWorks.${key}.step`)}</div>
              <h3 className="text-lg font-semibold text-foreground -mt-6 mb-2">{t(`howItWorks.${key}.title`)}</h3>
              <p className="text-sm text-foreground-secondary leading-relaxed">{t(`howItWorks.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Use cases by team */}
      <PageSection title={t("byTeamSection.title")} subtitle={t("byTeamSection.subtitle")}>
        <div className="mt-8 border border-border  overflow-hidden">
          <div className="flex border-b border-border">
            {useCaseMeta.map((u, i) => {
              const Icon = u.icon;
              return (
                <button
                  key={u.key}
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    i === activeTab
                      ? "text-foreground bg-background-secondary"
                      : "text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${i === activeTab ? u.color : ""}`} />
                  {t(`useCases.${u.key}.team`)}
                </button>
              );
            })}
          </div>
          <div className="p-8">
            <ul className="space-y-4">
              {(t.raw(`useCases.${useCaseMeta[activeTab].key}.items`) as string[]).map((item, i) => (
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
      <PageSection title={t("capabilitiesSection.title")} subtitle={t("capabilitiesSection.subtitle")}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
          {featureMeta.map((f) => {
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

      {/* Deployment */}
      <PageSection title={t("deploymentSection.title")} subtitle={t("deploymentSection.subtitle")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {deploymentOptionMeta.map((d) => {
            const Icon = d.icon;
            return (
              <Card key={d.key} variant="bordered" className="p-6">
                <Icon className="w-6 h-6 text-foreground-muted mb-3" />
                <h3 className="font-semibold text-foreground">{t(`deploymentOptions.${d.key}.name`)}</h3>
                <p className="mt-1 text-sm text-foreground-secondary">{t(`deploymentOptions.${d.key}.desc`)}</p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* Security */}
      <PageSection title={t("securitySection.title")} subtitle={t("securitySection.subtitle")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {security.map((item) => (
            <div key={item} className="flex items-center gap-3 p-4  bg-background-tertiary">
              <CheckCircle className="w-4 h-4 text-accent-success shrink-0" />
              <span className="text-sm text-foreground-secondary">{item}</span>
            </div>
          ))}
        </div>
      </PageSection>

      {/* CTA */}
      <div className="mt-20 p-8  bg-card border border-border text-center">
        <h3 className="text-2xl font-semibold text-foreground mb-2">{t("cta.title")}</h3>
        <p className="text-foreground-secondary mb-6">{t("cta.subtitle")}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg">{t("cta.startFreeTrial")}</Button>
          </Link>
          <Link href="/company/contact">
            <Button variant="outline" size="lg">{t("cta.talkToSales")}</Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-foreground-muted">{t("cta.fineprint")}</p>
      </div>
    </PageLayout>
  );
}
