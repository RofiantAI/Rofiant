import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function ComplianceGuidesPage() {
  const t = await getTranslations("resources.complianceGuides");

  const guides = [
    { title: t("guides.soc2.title"), desc: t("guides.soc2.desc") },
    { title: t("guides.dataPrivacy.title"), desc: t("guides.dataPrivacy.desc") },
    { title: t("guides.encryption.title"), desc: t("guides.encryption.desc") },
    { title: t("guides.accessControl.title"), desc: t("guides.accessControl.desc") },
    { title: t("guides.auditLogging.title"), desc: t("guides.auditLogging.desc") },
    { title: t("guides.incidentResponse.title"), desc: t("guides.incidentResponse.desc") },
  ];

  return (
    <PageLayout
      badge="RESOURCES"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {guides.map((g) => (
          <Card key={g.title} variant="bordered" className="p-6 hover:bg-card-hover transition-colors cursor-pointer">
            <h3 className="font-semibold text-foreground">{g.title}</h3>
            <p className="mt-2 text-sm text-foreground-secondary">{g.desc}</p>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}