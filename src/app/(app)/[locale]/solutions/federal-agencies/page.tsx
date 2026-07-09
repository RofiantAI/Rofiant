"use client";

import { Link } from "@/i18n/navigation";
import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Server, ShieldCheck, KeyRound, ClipboardList, CheckCircle,
  Lock, FileText, Building2, ChevronRight, Heart, Scale,
  Headphones, Landmark, Users
} from "lucide-react";
import { useTranslations } from "next-intl";

const featureMeta = [
  { key: "compliance", icon: ShieldCheck },
  { key: "identity", icon: KeyRound },
  { key: "procurement", icon: ClipboardList },
] as const;

const useCaseMeta = [
  { key: "acquisitionContracts", icon: ClipboardList },
  { key: "benefitsClaims", icon: Heart },
  { key: "regulatoryRulemaking", icon: Scale },
  { key: "citizenServices", icon: Headphones },
  { key: "legalFoia", icon: FileText },
  { key: "cyberAto", icon: Lock },
  { key: "grantsFinancial", icon: Landmark },
  { key: "humanCapital", icon: Users },
] as const;

const deploymentMeta = [
  { key: "cloud", icon: Server },
  { key: "cloudGcp", icon: Server },
  { key: "onPremises", icon: Building2 },
  { key: "airGapped", icon: Lock },
] as const;

export default function FederalAgenciesPage() {
  const t = useTranslations("solutions.federalAgencies");

  const stats = t.raw("stats") as { value: string; label: string; sub: string }[];
  const complianceFrameworks = t.raw("complianceFrameworks") as string[];
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
              <div className="text-xl font-normal text-foreground">{stat.value}</div>
              <div className="text-sm text-foreground mt-1">{stat.label}</div>
              <div className="text-xs text-foreground-muted">{stat.sub}</div>
            </div>
          ))}
        </div>
      }
    >
      {/* Mission statement */}
      <div className="bg-card border border-border  p-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">{t("mission.title")}</h3>
        <p className="text-foreground-secondary leading-relaxed mb-4">
          {t("mission.p1")}
        </p>
        <p className="text-foreground-secondary leading-relaxed">
          {t("mission.p2")}
        </p>
      </div>

      {/* Use cases */}
      <PageSection title={t("useCasesSection.title")} subtitle={t("useCasesSection.subtitle")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {useCaseMeta.map((u) => {
            const Icon = u.icon;
            const items = t.raw(`useCases.${u.key}.items`) as string[];
            return (
              <Card key={u.key} variant="bordered" className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t(`useCases.${u.key}.dept`)}</h3>
                    <p className="text-xs text-foreground-muted mt-0.5">{t(`useCases.${u.key}.agencies`)}</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground-secondary">
                      <CheckCircle className="w-4 h-4 text-accent-success shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </PageSection>

      <div className="mt-12 p-8 bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("deployBanner.title")}</h3>
          <p className="mt-2 text-sm text-foreground-secondary max-w-2xl">{t("deployBanner.subtitle")}</p>
        </div>
        <Link href="/dashboard/agency/solutions">
          <Button size="lg">{t("deployBanner.cta")}</Button>
        </Link>
      </div>

      {/* Features */}
      <PageSection title={t("capabilitiesSection.title")} subtitle={t("capabilitiesSection.subtitle")}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
          {featureMeta.map((f) => {
            const Icon = f.icon;
            const details = t.raw(`features.${f.key}.details`) as string[];

            return (
              <Card key={f.key} variant="bordered" className="p-6 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t(`features.${f.key}.title`)}</h3>
                    <p className="mt-1 text-sm text-foreground-secondary">{t(`features.${f.key}.desc`)}</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-14">
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

      {/* Compliance */}
      <PageSection title={t("complianceSection.title")} subtitle={t("complianceSection.subtitle")}>
        <div className="flex flex-wrap gap-3 mt-8">
          {complianceFrameworks.map((fw) => (
            <Badge key={fw} variant="success" className="px-4 py-2 text-sm">
              {fw}
            </Badge>
          ))}
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

      {/* Deployment */}
      <PageSection title={t("deploymentSection.title")} subtitle={t("deploymentSection.subtitle")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {deploymentMeta.map((d) => {
            const Icon = d.icon;
            return (
              <Card key={d.key} variant="bordered" className="p-6">
                <Icon className="w-6 h-6 text-foreground-muted mb-3" />
                <h3 className="font-semibold text-foreground">{t(`deployment.${d.key}.name`)}</h3>
                <p className="mt-1 text-sm text-foreground-secondary">{t(`deployment.${d.key}.desc`)}</p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* CTA */}
      <div className="mt-20 p-8  bg-card border border-border text-center">
        <h3 className="text-2xl font-semibold text-foreground mb-2">{t("cta.title")}</h3>
        <p className="text-foreground-secondary mb-6">{t("cta.subtitle")}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/company/contact">
            <Button size="lg">{t("cta.talkToTeam")}</Button>
          </Link>
          <Link href="/legal/fedramp">
            <Button variant="outline" size="lg">{t("cta.requestDocs")}</Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-foreground-muted">{t("cta.fineprint")}</p>
      </div>
    </PageLayout>
  );
}
