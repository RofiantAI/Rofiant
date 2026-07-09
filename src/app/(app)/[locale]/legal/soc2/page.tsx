import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function Soc2Page() {
  const t = await getTranslations("legal.soc2");

  const criteria = [
    { key: "security", count: 33 },
    { key: "availability", count: 8 },
    { key: "processingIntegrity", count: 6 },
    { key: "confidentiality", count: 4 },
    { key: "privacy", count: 12 },
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
          {t("criteriaHeading")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {criteria.map((c) => (
            <Card
              key={c.key}
              variant="bordered"
              className="p-4 flex items-center justify-between"
            >
              <div>
                <span className="text-sm font-medium text-foreground">
                  {t(`criteria.${c.key}`)}
                </span>
                <span className="ml-2 text-xs text-foreground-muted">
                  ({t("controlsCount", { count: c.count })})
                </span>
              </div>
              <span className="text-xs text-accent-success">{t("status.covered")}</span>
            </Card>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-foreground">
          {t("reportAccessHeading")}
        </h2>
        <p>
          {t("reportAccessBody")}
        </p>

        <h2 className="text-lg font-semibold text-foreground">{t("contactHeading")}</h2>
        <p>
          {t("contactBody")}
        </p>
      </div>
    </PageLayout>
  );
}
