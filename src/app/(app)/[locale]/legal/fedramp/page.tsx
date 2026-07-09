import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function FedRAMPPage() {
  const t = await getTranslations("legal.fedramp");

  const controls = [
    { family: t("controls.accessControl"), status: t("status.inProgress"), count: 25 },
    { family: t("controls.auditAndAccountability"), status: t("status.inProgress"), count: 16 },
    { family: t("controls.configurationManagement"), status: t("status.inProgress"), count: 11 },
    {
      family: t("controls.identificationAndAuthentication"),
      status: t("status.inProgress"),
      count: 11,
    },
    {
      family: t("controls.systemAndCommunicationsProtection"),
      status: t("status.inProgress"),
      count: 17,
    },
    {
      family: t("controls.systemAndInformationIntegrity"),
      status: t("status.inProgress"),
      count: 14,
    },
  ];

  return (
    <PageLayout
      badge="LEGAL"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="space-y-8 text-foreground-secondary text-sm leading-relaxed">
        <p className="text-base">
          {t("intro")}
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          {t("controlFamiliesHeading")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {controls.map((c) => (
            <Card
              key={c.family}
              variant="bordered"
              className="p-4 flex items-center justify-between"
            >
              <div>
                <span className="text-sm font-medium text-foreground">
                  {c.family}
                </span>
                <span className="ml-2 text-xs text-foreground-muted">
                  ({t("controlsCount", { count: c.count })})
                </span>
              </div>
              <span className="text-xs text-accent-success">{c.status}</span>
            </Card>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-foreground">
          {t("deploymentOptionsHeading")}
        </h2>
        <p>
          {t("deploymentOptionsBody")}
        </p>

        <h2 className="text-lg font-semibold text-foreground">{t("contactHeading")}</h2>
        <p>
          {t("contactBody")}
        </p>
      </div>
    </PageLayout>
  );
}
