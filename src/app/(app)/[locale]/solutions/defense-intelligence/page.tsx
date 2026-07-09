"use client";

import { Link } from "@/i18n/navigation";
import { PageLayout, PageSection } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, FileSearch, Radio, Shield, CheckCircle, AlertTriangle, Server } from "lucide-react";
import { useTranslations } from "next-intl";

const featureMeta = [
  { key: "airGapped", icon: Lock },
  { key: "documentIntelligence", icon: FileSearch },
  { key: "voiceTranscription", icon: Radio },
  { key: "auditCompliance", icon: Shield },
] as const;

const deploymentMeta = [
  { key: "cloudAws", icon: Server, available: true },
  { key: "cloudAzure", icon: Server, available: true },
  { key: "cloudGcp", icon: Server, available: false },
  { key: "onPremises", icon: Server, available: true },
  { key: "airGapped", icon: Lock, available: true },
  { key: "classified", icon: AlertTriangle, available: false },
] as const;

export default function DefenseIntelligencePage() {
  const t = useTranslations("solutions.defenseIntelligence");

  return (
    <PageLayout
      badge={t("badge")}
      badgeVariant="success"
      title={t("title")}
      subtitle={t("subtitle")}
      hero={
        <div className="bg-card border border-border p-6">
          <h3 className="text-sm font-medium text-foreground-secondary mb-4 flex items-center gap-2">
            <Server className="w-4 h-4" />
            {t("deploymentEnvironmentsTitle")}
          </h3>
          <div className="space-y-3">
            {deploymentMeta.map((d) => {
              const Icon = d.icon;
              const status = t(`deployments.${d.key}.status`);
              const isAvailable = d.available;

              return (
                <div
                  key={d.key}
                  className="flex items-center justify-between p-3 border border-border bg-background-secondary"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-foreground-muted" />
                    <span className="text-sm text-foreground">{t(`deployments.${d.key}.env`)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAvailable ? (
                      <CheckCircle className="w-4 h-4 text-accent-success" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-accent-warning" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        isAvailable ? "text-accent-success" : "text-accent-warning"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
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
