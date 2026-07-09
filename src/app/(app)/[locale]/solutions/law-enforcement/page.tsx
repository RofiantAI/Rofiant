"use client";

import { Link } from "@/i18n/navigation";
import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Radio, FileOutput, Shield, Clock, Zap, BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

const featureMeta = [
  { key: "caseFile", icon: FileText },
  { key: "transcript", icon: Radio },
  { key: "reportGeneration", icon: FileOutput },
  { key: "chainOfCustody", icon: Shield },
] as const;

const metricMeta = [
  { key: "faster", icon: BarChart3 },
  { key: "search", icon: Zap },
  { key: "audit", icon: Clock },
] as const;

export default function LawEnforcementPage() {
  const t = useTranslations("solutions.lawEnforcement");

  return (
    <PageLayout
      badge={t("badge")}
      badgeVariant="success"
      title={t("title")}
      subtitle={t("subtitle")}
      hero={
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {metricMeta.map((s) => {
            const Icon = s.icon;

            return (
              <div
                key={s.key}
                className="bg-card border border-border p-5 text-center"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-normal text-foreground">
                  {t(`metrics.${s.key}.metric`)}
                </div>
                <div className="text-xs text-foreground-muted mt-1">
                  {t(`metrics.${s.key}.label`)}
                </div>
              </div>
            );
          })}
        </div>
      }
    >
      <PageSection title={t("capabilitiesTitle")}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
          {featureMeta.map((f) => {
            const Icon = f.icon;

            return (
              <Card key={f.key} variant="bordered" className="p-6 h-full">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{t(`features.${f.key}.title`)}</h3>
                <p className="mt-2 text-sm text-foreground-secondary">{t(`features.${f.key}.desc`)}</p>
              </Card>
            );
          })}
        </div>
      </PageSection>

      <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/company/contact">
          <Button size="lg">{t("talkToSales")}</Button>
        </Link>
        <p className="text-sm text-foreground-muted">{t("customDeployment")}</p>
      </div>
    </PageLayout>
  );
}
